import json
import uuid
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.audit import canonical_json, compute_event_hash, GENESIS_HASH
from backend.app.models.db_models import (
    ApprovalCard, Approval, VerificationStep, VerificationPlan, Chain,
    AuditEvent, utcnow_str
)
from backend.app.approvals.crypto import create_approval_token, verify_approval_token

class ApprovalService:
    def __init__(self):
        self.consumed_nonces: set = set()

    def create_card_for_step(self, step_id: str, db: Session, requested_by: str = "agent") -> Dict[str, Any]:
        step = db.query(VerificationStep).filter(VerificationStep.id == step_id).first()
        if not step:
            raise ValueError(f"Step {step_id} not found")

        plan = db.query(VerificationPlan).filter(VerificationPlan.id == step.plan_id).first()
        chain_id = plan.chain_id if plan else ""

        # Target metadata resolution
        target_dict = {
            "asset_id": step.target_asset,
            "container": "redis-lab" if "redis" in step.target_asset else ("git-lab" if "git" in step.target_asset else "app-lab"),
            "ip": "10.77.0.12" if "redis" in step.target_asset else ("10.77.0.11" if "git" in step.target_asset else "10.77.0.10")
        }

        blast_radius = json.loads(step.blast_json or "{}")

        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(seconds=settings.CR_APPROVAL_TTL_SECONDS)).isoformat()

        card_id = f"crd_{uuid.uuid4().hex[:8]}"
        card_content = {
            "id": card_id,
            "step_id": step_id,
            "chain_id": chain_id,
            "title": f"Verify {step.action} (Step {step.ord})",
            "command": step.command_preview,
            "command_hash": step.command_hash,
            "target": target_dict,
            "risk_level": step.risk_level,
            "blast_radius": blast_radius,
            "reason": f"Automated verification of precondition for chain step {step.ord}",
            "rollback": "none required" if step.reversible else "manual recovery",
            "timeout_s": 20,
            "requested_by": requested_by,
            "status": "pending",
            "created_at": now.isoformat(),
            "expires_at": expires_at
        }

        card = ApprovalCard(
            id=card_id,
            step_id=step_id,
            status="pending",
            card_json=json.dumps(card_content),
            created_at=now.isoformat(),
            expires_at=expires_at
        )
        db.add(card)

        # Audit event
        last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = last_audit.hash if last_audit else GENESIS_HASH
        ts = utcnow_str()
        payload_str = canonical_json({"card_id": card_id, "step_id": step_id, "command_hash": step.command_hash})
        ev_hash = compute_event_hash(prev_hash, ts, requested_by, "APPROVAL_REQUESTED", payload_str)
        db.add(AuditEvent(ts=ts, actor=requested_by, type="APPROVAL_REQUESTED", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
        db.commit()

        return card_content

    def approve_card(
        self,
        card_id: str,
        approver: str,
        justification: str = "",
        db: Session = None,
        narrow: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        card = db.query(ApprovalCard).filter(ApprovalCard.id == card_id).first()
        if not card:
            raise ValueError(f"Card {card_id} not found")

        if card.status != "pending":
            return {"status": card.status, "error": f"Card already in status {card.status}"}

        # Check expiry
        exp_dt = datetime.fromisoformat(card.expires_at)
        if exp_dt < datetime.now(timezone.utc):
            card.status = "expired"
            db.commit()
            return {"status": "expired", "error": "Approval card has expired"}

        card_data = json.loads(card.card_json)

        # Check separate approver invariant INV-11
        if settings.CR_REQUIRE_SEPARATE_APPROVER:
            requested_by = card_data.get("requested_by", "")
            if approver == requested_by:
                raise PermissionError("Separate approver requirement enabled: requester cannot approve own card")

        step = db.query(VerificationStep).filter(VerificationStep.id == card.step_id).first()

        # Handle narrowing if provided
        if narrow:
            if "timeout_s" in narrow:
                card_data["timeout_s"] = min(card_data.get("timeout_s", 20), int(narrow["timeout_s"]))
            card.card_json = json.dumps(card_data)

        # Generate HMAC token
        token, nonce = create_approval_token(
            card_id=card.id,
            step_id=step.id,
            command_hash=step.command_hash,
            target=card_data.get("target", {}),
            approver=approver,
            ttl_seconds=settings.CR_APPROVAL_TTL_SECONDS
        )

        approval_id = f"appr_{uuid.uuid4().hex[:8]}"
        approval = Approval(
            id=approval_id,
            card_id=card.id,
            decision="approved",
            approver=approver,
            justification=justification,
            nonce=nonce,
            consumed=0,
            decided_at=utcnow_str()
        )
        db.add(approval)
        card.status = "approved"

        # Audit
        last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = last_audit.hash if last_audit else GENESIS_HASH
        ts = utcnow_str()
        payload_str = canonical_json({
            "card_id": card_id,
            "approval_id": approval_id,
            "approver": approver,
            "command_hash": step.command_hash,
            "decision": "approved"
        })
        ev_hash = compute_event_hash(prev_hash, ts, approver, "APPROVAL_DECIDED", payload_str)
        db.add(AuditEvent(ts=ts, actor=approver, type="APPROVAL_DECIDED", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
        db.commit()

        return {
            "status": "approved",
            "token": token,
            "nonce": nonce,
            "card_id": card_id,
            "approval_id": approval_id
        }

    def deny_card(self, card_id: str, approver: str, reason: str, db: Session) -> Dict[str, Any]:
        card = db.query(ApprovalCard).filter(ApprovalCard.id == card_id).first()
        if not card:
            raise ValueError(f"Card {card_id} not found")

        card.status = "denied"
        approval = Approval(
            id=f"appr_{uuid.uuid4().hex[:8]}",
            card_id=card.id,
            decision="denied",
            approver=approver,
            justification=reason,
            nonce=f"denied_{uuid.uuid4().hex}",
            consumed=1,
            decided_at=utcnow_str()
        )
        db.add(approval)

        last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = last_audit.hash if last_audit else GENESIS_HASH
        ts = utcnow_str()
        payload_str = canonical_json({"card_id": card_id, "approver": approver, "decision": "denied", "reason": reason})
        ev_hash = compute_event_hash(prev_hash, ts, approver, "APPROVAL_DENIED", payload_str)
        db.add(AuditEvent(ts=ts, actor=approver, type="APPROVAL_DENIED", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
        db.commit()

        return {"status": "denied", "card_id": card_id}

    def consume_token(self, nonce: str, db: Session):
        self.consumed_nonces.add(nonce)
        approval = db.query(Approval).filter(Approval.nonce == nonce).first()
        if approval:
            approval.consumed = 1
            card = db.query(ApprovalCard).filter(ApprovalCard.id == approval.card_id).first()
            if card:
                card.status = "consumed"
            db.commit()

approval_service = ApprovalService()

