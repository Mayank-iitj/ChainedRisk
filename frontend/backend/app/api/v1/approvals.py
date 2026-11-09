import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import ApprovalCard, VerificationStep
from backend.app.models.schemas import ApprovalCardResponse, ApproveRequest, DenyRequest
from backend.app.approvals.service import approval_service
from backend.app.core.events import manager as ws_manager

router = APIRouter(prefix="/approvals", tags=["approvals"])

@router.get("")
def list_approvals(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ApprovalCard)
    if status:
        query = query.filter(ApprovalCard.status == status)
    else:
        query = query.filter(ApprovalCard.status == "pending")

    cards = query.all()
    res = []
    for c in cards:
        data = json.loads(c.card_json)
        data["status"] = c.status
        res.append(data)
    return res

@router.get("/{id}")
def get_approval_card(id: str, db: Session = Depends(get_db)):
    c = db.query(ApprovalCard).filter(ApprovalCard.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Approval card not found")
    data = json.loads(c.card_json)
    data["status"] = c.status
    return data

@router.post("/{id}/approve")
async def approve_card(id: str, req: ApproveRequest = ApproveRequest(), db: Session = Depends(get_db)):
    try:
        result = approval_service.approve_card(
            card_id=id,
            approver="approver",
            justification=req.justification or "Approved by security analyst in lab context",
            db=db,
            narrow=req.narrow
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if result.get("error"):
        if result.get("status") == "expired":
            raise HTTPException(status_code=410, detail=result["error"])
        raise HTTPException(status_code=409, detail=result["error"])

    # Broadcast event
    await ws_manager.broadcast("approval.decided", {"card_id": id, "status": "approved", "approver": "approver"})
    return result

@router.post("/{id}/deny")
async def deny_card(id: str, req: DenyRequest = DenyRequest(), db: Session = Depends(get_db)):
    try:
        result = approval_service.deny_card(
            card_id=id,
            approver="approver",
            reason=req.reason or "Denied by reviewer",
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await ws_manager.broadcast("approval.decided", {"card_id": id, "status": "denied", "approver": "approver"})
    return result

