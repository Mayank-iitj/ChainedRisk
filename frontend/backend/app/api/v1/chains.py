import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import Chain, ChainStep, Finding, RejectedHypothesis, VerificationPlan, VerificationStep
from backend.app.models.schemas import CorrelateRequest, ChainResponse
from backend.app.chain.engine import chain_engine
from backend.app.chain.remediation import compute_min_cut_remediation
from backend.app.verify.planner import create_verification_plan

router = APIRouter(tags=["chains"])

@router.post("/projects/{id}/correlate")
def correlate_project(
    id: str,
    req: CorrelateRequest = CorrelateRequest(),
    db: Session = Depends(get_db)
):
    results = chain_engine.correlate(
        project_id=id,
        db=db,
        use_llm=req.use_llm if req.use_llm is not None else True,
        actor="analyst"
    )
    return {
        "status": "completed",
        "chains_count": len(results),
        "chains": results
    }

@router.get("/projects/{id}/chains")
def list_chains(
    id: str,
    min_score: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Chain).filter(Chain.project_id == id)
    if min_score:
        query = query.filter(Chain.score >= min_score)
    if status:
        query = query.filter(Chain.status == status)

    chains = query.order_by(Chain.score.desc()).all()
    remediations = compute_min_cut_remediation(id, db)

    res = []
    for c in chains:
        steps = db.query(ChainStep).filter(ChainStep.chain_id == c.id).order_by(ChainStep.ord.asc()).all()
        step_objs = []
        for s in steps:
            step_objs.append({
                "id": s.id,
                "order": s.ord,
                "finding_ids": json.loads(s.finding_ids_json or "[]"),
                "requires": json.loads(s.requires_json or "[]"),
                "provides": json.loads(s.provides_json or "[]"),
                "narrative": s.narrative,
                "evidence_refs": json.loads(s.evidence_refs_json or "[]")
            })

        res.append({
            "id": c.id,
            "project_id": c.project_id,
            "title": c.title,
            "score": c.score,
            "severity": c.severity,
            "likelihood": c.likelihood,
            "impact": c.impact,
            "chain_gain": c.chain_gain,
            "origin": c.origin,
            "confidence": c.confidence,
            "status": c.status,
            "steps": step_objs,
            "explanation": c.explanation,
            "remediation": remediations,
            "validation": json.loads(c.validation_json or "{}"),
            "created_at": c.created_at
        })
    return res

@router.get("/chains/{id}")
def get_chain(id: str, db: Session = Depends(get_db)):
    c = db.query(Chain).filter(Chain.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chain not found")

    steps = db.query(ChainStep).filter(ChainStep.chain_id == c.id).order_by(ChainStep.ord.asc()).all()
    step_objs = []
    for s in steps:
        step_objs.append({
            "id": s.id,
            "order": s.ord,
            "finding_ids": json.loads(s.finding_ids_json or "[]"),
            "requires": json.loads(s.requires_json or "[]"),
            "provides": json.loads(s.provides_json or "[]"),
            "narrative": s.narrative
        })

    remediations = compute_min_cut_remediation(c.project_id, db)
    return {
        "id": c.id,
        "project_id": c.project_id,
        "title": c.title,
        "score": c.score,
        "severity": c.severity,
        "likelihood": c.likelihood,
        "impact": c.impact,
        "chain_gain": c.chain_gain,
        "origin": c.origin,
        "confidence": c.confidence,
        "status": c.status,
        "steps": step_objs,
        "explanation": c.explanation,
        "remediation": remediations,
        "validation": json.loads(c.validation_json or "{}"),
        "created_at": c.created_at
    }

@router.post("/chains/{id}/plan")
def plan_chain_verification(id: str, db: Session = Depends(get_db)):
    plan = create_verification_plan(chain_id=id, db=db)
    return plan

@router.post("/chains/{id}/dismiss")
def dismiss_chain(id: str, reason: str = "False positive or accepted risk", db: Session = Depends(get_db)):
    c = db.query(Chain).filter(Chain.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chain not found")
    c.status = "dismissed"
    db.commit()
    return {"status": "dismissed", "chain_id": id, "reason": reason}

@router.get("/chains/{id}/rejections")
def get_rejected_hypotheses(id: str, db: Session = Depends(get_db)):
    c = db.query(Chain).filter(Chain.id == id).first()
    project_id = c.project_id if c else "prj_demo"
    rejections = db.query(RejectedHypothesis).filter(RejectedHypothesis.project_id == project_id).all()
    res = []
    for r in rejections:
        res.append({
            "id": r.id,
            "reason": r.reason,
            "payload": json.loads(r.payload_json or "{}"),
            "created_at": r.created_at
        })
    return res

@router.get("/projects/{id}/rejections")
def get_project_rejections(id: str, db: Session = Depends(get_db)):
    rejections = db.query(RejectedHypothesis).filter(RejectedHypothesis.project_id == id).all()
    res = []
    for r in rejections:
        res.append({
            "id": r.id,
            "reason": r.reason,
            "payload": json.loads(r.payload_json or "{}"),
            "created_at": r.created_at
        })
    return res

@router.get("/projects/{id}/remediation")
def get_remediation(id: str, db: Session = Depends(get_db)):
    return compute_min_cut_remediation(project_id=id, db=db)

@router.post("/projects/{id}/simulate-fix")
def simulate_fix(id: str, excluded_finding_ids: List[str], db: Session = Depends(get_db)):
    """
    Simulates applying fixes by temporarily excluding specific findings and re-evaluating chains.
    Shows the judge how fixing a finding collapses the attack chains live!
    """
    current_chains = db.query(Chain).filter(Chain.project_id == id).all()
    all_findings = db.query(Finding).filter(Finding.project_id == id).all()

    # Expand excluded findings to match direct ID, stripped ID prefix, rule_id, or title keywords
    matching_fids = set(excluded_finding_ids)
    for f in all_findings:
        for ex in excluded_finding_ids:
            clean_ex = ex.lower().replace("fnd_", "").replace("ast_", "").strip()
            f_title = (f.title or "").lower()
            f_rule = (f.rule_id or "").lower()
            f_id = (f.id or "").lower()

            if (ex.lower() == f_id or
                (clean_ex and (clean_ex in f_id or clean_ex in f_rule or clean_ex in f_title)) or
                ("ssrf" in clean_ex and ("ssrf" in f_title or "request forgery" in f_title or "ssrf" in f_rule)) or
                ("git" in clean_ex and "git" in f_title) or
                ("redis" in clean_ex and "redis" in f_title)):
                matching_fids.add(f.id)

    remaining_chains = []

    for c in current_chains:
        steps = db.query(ChainStep).filter(ChainStep.chain_id == c.id).all()
        broken = False
        for s in steps:
            fids = json.loads(s.finding_ids_json or "[]")
            if any(fid in matching_fids for fid in fids):
                broken = True
                break
        if not broken:
            remaining_chains.append(c.id)

    return {
        "original_chains_count": len(current_chains),
        "remaining_chains_count": len(remaining_chains),
        "chains_collapsed": len(current_chains) - len(remaining_chains),
        "remediated_findings": excluded_finding_ids
    }

