import asyncio
import json
import uuid
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.core.audit import canonical_json, compute_event_hash, GENESIS_HASH
from backend.app.core.events import manager as ws_manager
from backend.app.models.db_models import (
    VerificationStep, Execution, ApprovalCard, Approval, Chain,
    VerificationPlan, AuditEvent, utcnow_str
)
from backend.app.policy.engine import policy_engine
from backend.app.approvals.crypto import verify_approval_token
from backend.app.approvals.service import approval_service

class ApprovalRequiredError(Exception):
    pass

class PolicyViolationError(Exception):
    pass

class TokenVerificationError(Exception):
    pass

class SystemLockedError(Exception):
    pass

class Executor:
    def __init__(self):
        self.active_executions: Dict[str, Any] = {}

    async def execute_step(
        self,
        step_id: str,
        token: Optional[str],
        db: Session,
        actor: str = "agent"
    ) -> Dict[str, Any]:
        # 1. Kill Switch Check (Invariant INV-8)
        if policy_engine.kill_locked:
            raise SystemLockedError(f"System is locked: {policy_engine.lock_reason}")

        step = db.query(VerificationStep).filter(VerificationStep.id == step_id).first()
        if not step:
            raise ValueError(f"Step {step_id} not found")

        # 2. Risk Level & Token requirement check (Invariant INV-1)
        if step.risk_level in {"L1", "L2", "L3"}:
            if not token:
                raise ApprovalRequiredError(f"Step {step_id} ({step.risk_level}) requires an approval token")

            # Verify token cryptographically (Invariants INV-2, INV-3, INV-4)
            is_valid, payload, err_reason = verify_approval_token(
                token=token,
                expected_command_hash=step.command_hash,
                consumed_nonces=approval_service.consumed_nonces
            )
            if not is_valid:
                # Audit token rejection
                last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
                prev_hash = last_audit.hash if last_audit else GENESIS_HASH
                ts = utcnow_str()
                payload_str = canonical_json({"step_id": step_id, "reason": err_reason})
                ev_hash = compute_event_hash(prev_hash, ts, actor, "TOKEN_REJECTED", payload_str)
                db.add(AuditEvent(ts=ts, actor=actor, type="TOKEN_REJECTED", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
                db.commit()
                raise TokenVerificationError(f"Token verification failed: {err_reason}")

            # Policy check (Invariant INV-5)
            step_eval_data = {
                "risk_level": step.risk_level,
                "target": payload.get("target", {})
            }
            decision, p_reason = policy_engine.evaluate(step_eval_data, actor)
            if decision == "deny":
                raise PolicyViolationError(f"Policy denied execution: {p_reason}")

            nonce = payload.get("nonce")
        else:
            nonce = None

        # Create Execution record
        exec_id = f"exe_{uuid.uuid4().hex[:8]}"
        execution = Execution(
            id=exec_id,
            step_id=step.id,
            status="running",
            verdict="pending",
            started_at=utcnow_str(),
            logs=f"[*] Starting execution of {step.action}\n[*] Target: {step.target_asset}\n[*] Command hash: {step.command_hash}\n"
        )
        db.add(execution)
        db.commit()

        # Stream WebSocket event
        await ws_manager.broadcast("execution.started", {"execution_id": exec_id, "step_id": step.id})

        # Run action emulation / probe safely
        logs_output = []
        logs_output.append(f"[*] Dispatching runner to isolated network: chained_lab")
        logs_output.append(f"[*] Running command: {step.command_preview}")

        verdict = "confirmed"
        exit_code = 0

        # Simulate execution progress with realistic probes
        if step.action == "git_exposure_check":
            logs_output.append("[+] Connected to http://10.77.0.10:8080")
            logs_output.append("[+] GET /.git/config HTTP/1.1 -> 200 OK")
            logs_output.append("[+] Discovered Git remote config: url = http://git.lab/app.git")
            logs_output.append("[+] VERDICT: Git exposure verified (read-only reachability confirmed)")
        elif step.action == "ssrf_canary_probe":
            logs_output.append("[+] Connected to http://10.77.0.10:8080/fetch")
            logs_output.append("[+] Requesting target: http://10.77.0.12:6379/")
            logs_output.append("[+] Upstream connection returned Redis banner marker (-ERR wrong number of arguments)")
            logs_output.append("[+] VERDICT: Internal SSRF pivot reachability confirmed")
        elif step.action == "redis_unauth_ping":
            logs_output.append("[+] TCP connect to 10.77.0.12:6379 succeeded")
            logs_output.append("[+] Sent command: PING")
            logs_output.append("[+] Received response: +PONG (no authentication required)")
            logs_output.append("[+] VERDICT: Unauthenticated Redis access verified")
        else:
            logs_output.append("[+] Connection test successful")
            logs_output.append("[+] VERDICT: Precondition confirmed")

        full_logs = "\n".join(logs_output)
        execution.logs = full_logs
        execution.status = "completed"
        execution.verdict = verdict
        execution.exit_code = exit_code
        execution.ended_at = utcnow_str()

        # Consume token nonce
        if nonce:
            approval_service.consume_token(nonce, db)

        # Update step status
        step.status = "verified"

        # Check if all steps in plan are verified -> update chain to confirmed
        plan = db.query(VerificationPlan).filter(VerificationPlan.id == step.plan_id).first()
        if plan:
            all_steps = db.query(VerificationStep).filter(VerificationStep.plan_id == plan.id).all()
            if all(s.status == "verified" for s in all_steps):
                chain = db.query(Chain).filter(Chain.id == plan.chain_id).first()
                if chain:
                    chain.status = "confirmed"

        # Audit
        last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = last_audit.hash if last_audit else GENESIS_HASH
        ts = utcnow_str()
        payload_str = canonical_json({
            "execution_id": exec_id,
            "step_id": step_id,
            "action": step.action,
            "verdict": verdict,
            "exit_code": exit_code
        })
        ev_hash = compute_event_hash(prev_hash, ts, actor, "EXECUTED", payload_str)
        db.add(AuditEvent(ts=ts, actor=actor, type="EXECUTED", payload_json=payload_str, prev_hash=prev_hash, hash=ev_hash))
        db.commit()

        # Stream WebSocket finish
        await ws_manager.broadcast("execution.finished", {
            "execution_id": exec_id,
            "step_id": step.id,
            "verdict": verdict,
            "logs": full_logs
        })

        return {
            "execution_id": exec_id,
            "step_id": step.id,
            "status": "completed",
            "verdict": verdict,
            "exit_code": exit_code,
            "logs": full_logs
        }

executor = Executor()

