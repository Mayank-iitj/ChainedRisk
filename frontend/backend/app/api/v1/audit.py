import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import AuditEvent
from backend.app.core.audit import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("")
def list_audit_events(
    type: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent).order_by(AuditEvent.id.asc())
    if type:
        query = query.filter(AuditEvent.type == type)
    if actor:
        query = query.filter(AuditEvent.actor == actor)

    events = query.limit(limit).all()
    res = []
    for ev in events:
        res.append({
            "id": ev.id,
            "ts": ev.ts,
            "actor": ev.actor,
            "type": ev.type,
            "payload": json.loads(ev.payload_json or "{}"),
            "prev_hash": ev.prev_hash,
            "hash": ev.hash
        })
    return res

@router.get("/verify")
def verify_audit_ledger(db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    is_valid, count, head_hash, err = verify_audit_chain(events)
    return {
        "valid": is_valid,
        "events": count,
        "head_hash": head_hash,
        "error": err
    }

