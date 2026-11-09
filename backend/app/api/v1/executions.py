from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import VerificationPlan, VerificationStep, Execution, ApprovalCard, Approval
from backend.app.approvals.service import approval_service
from backend.app.executor.runner import (
    executor, ApprovalRequiredError, PolicyViolationError,
    TokenVerificationError, SystemLockedError
)
from backend.app.core.events import manager as ws_manager

router = APIRouter(tags=["executions"])

@router.post("/plans/{id}/run")
async def run_plan(id: str, mode: str = "step", db: Session = Depends(get_db)):
    plan = db.query(VerificationPlan).filter(VerificationPlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    steps = db.query(VerificationStep).filter(VerificationStep.plan_id == id).order_by(VerificationStep.ord.asc()).all()
    if not steps:
        raise HTTPException(status_code=400, detail="Plan has no steps")

    # Find the first pending step
    target_step = None
    for s in steps:
        if s.status == "pending":
            target_step = s
            break

    if not target_step:
        return {"status": "all_steps_verified", "plan_id": id}

    # If step requires approval, generate Approval Card and pause!
    if target_step.risk_level in {"L1", "L2"}:
        # Check if card already exists
        card = db.query(ApprovalCard).filter(ApprovalCard.step_id == target_step.id, ApprovalCard.status == "pending").first()
        if not card:
            card_data = approval_service.create_card_for_step(target_step.id, db, requested_by="agent")
        else:
            import json
            card_data = json.loads(card.card_json)

        # Notify UI via WebSocket
        await ws_manager.broadcast("approval.requested", {"card": card_data})

        return {
            "status": "approval_required",
            "message": "Step requires explicit human approval before execution. Approval Card generated.",
            "card": card_data,
            "step_id": target_step.id
        }

    return {"status": "ready", "step_id": target_step.id}

@router.post("/executions/run-step")
async def execute_approved_step(step_id: str, token: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        res = await executor.execute_step(step_id=step_id, token=token, db=db, actor="approver")
        return res
    except ApprovalRequiredError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except TokenVerificationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PolicyViolationError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except SystemLockedError as e:
        raise HTTPException(status_code=423, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/executions/{id}")
def get_execution(id: str, db: Session = Depends(get_db)):
    ex = db.query(Execution).filter(Execution.id == id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Execution not found")
    return {
        "id": ex.id,
        "step_id": ex.step_id,
        "status": ex.status,
        "verdict": ex.verdict,
        "exit_code": ex.exit_code,
        "started_at": ex.started_at,
        "ended_at": ex.ended_at,
        "logs": ex.logs
    }

@router.get("/executions/{id}/logs")
def get_execution_logs(id: str, db: Session = Depends(get_db)):
    ex = db.query(Execution).filter(Execution.id == id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Execution not found")
    return {"logs": ex.logs}

