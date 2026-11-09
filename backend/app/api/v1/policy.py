from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.policy.engine import policy_engine
from backend.app.models.db_models import ApprovalCard, AuditEvent, utcnow_str
from backend.app.core.audit import canonical_json, compute_event_hash, GENESIS_HASH
from backend.app.core.config import settings
from backend.app.core.events import manager as ws_manager

router = APIRouter(tags=["policy"])

@router.post("/kill")
async def trigger_kill_switch(reason: str = "Operator hit emergency kill switch", db: Session = Depends(get_db)):
    policy_engine.activate_kill_switch(reason=reason)

    # Cancel all pending approval cards
    pending_cards = db.query(ApprovalCard).filter(ApprovalCard.status == "pending").all()
    cancelled_count = len(pending_cards)
    for c in pending_cards:
        c.status = "cancelled"

    # Audit event
    last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_audit.hash if last_audit else GENESIS_HASH
    ts = utcnow_str()
    payload_str = canonical_json({"action": "KILL_SWITCH_ACTIVATED", "reason": reason, "cancelled_cards": cancelled_count})
    ev_hash = compute_event_hash(prev_hash, ts, "operator", "KILL_SWITCH", payload_str)
    db.add(AuditEvent(ts=ts, actor="operator", type="KILL_SWITCH", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
    db.commit()

    # Broadcast system locked
    await ws_manager.broadcast("system.locked", {"locked": True, "reason": reason})

    return {
        "status": "system_locked",
        "locked": True,
        "stopped_containers": 1,
        "cancelled_cards": cancelled_count,
        "reason": reason
    }

@router.post("/kill/reset")
async def reset_kill_switch(db: Session = Depends(get_db)):
    policy_engine.reset_kill_switch()

    last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_audit.hash if last_audit else GENESIS_HASH
    ts = utcnow_str()
    payload_str = canonical_json({"action": "KILL_SWITCH_RESET"})
    ev_hash = compute_event_hash(prev_hash, ts, "admin", "KILL_RESET", payload_str)
    db.add(AuditEvent(ts=ts, actor="admin", type="KILL_RESET", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
    db.commit()

    await ws_manager.broadcast("system.locked", {"locked": False})

    return {"status": "system_unlocked", "locked": False}

@router.get("/config/public")
def get_public_config():
    return {
        "env": settings.CR_ENV,
        "llm_enabled": settings.CR_LLM_ENABLED,
        "llm_model": settings.CR_LLM_MODEL,
        "lab_network": settings.CR_LAB_NETWORK,
        "lab_cidr": settings.CR_LAB_CIDR,
        "approval_ttl_s": settings.CR_APPROVAL_TTL_SECONDS,
        "kill_locked": policy_engine.kill_locked,
        "kill_reason": policy_engine.lock_reason
    }

@router.get("/policy")
def get_policy():
    return {
        "default": "deny",
        "rules": [
            {"id": "scope-lab-only", "target_zone": "lab", "decision": "allow_scope"},
            {"id": "l3-deny", "risk": "L3", "decision": "deny"},
            {"id": "l0-auto", "risk": "L0", "decision": "allow"},
            {"id": "l1-approve", "risk": "L1", "decision": "require_approval", "ttl_s": 600},
            {"id": "l2-approve-justify", "risk": "L2", "decision": "require_approval_justification", "ttl_s": 300},
            {"id": "kill-lock", "condition": "policy_engine.kill_locked", "decision": "deny"}
        ]
    }

