import json
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import Project, Asset, Finding, Chain, ApprovalCard, utcnow_str
from backend.app.models.schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse)
def create_project(req: ProjectCreate, db: Session = Depends(get_db)):
    pid = f"prj_{uuid.uuid4().hex[:8]}"
    project = Project(
        id=pid,
        name=req.name,
        description=req.description or "",
        scope_json=json.dumps(req.scope.model_dump()),
        created_by="analyst",
        created_at=utcnow_str()
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "scope": json.loads(project.scope_json),
        "created_by": project.created_by,
        "created_at": project.created_at
    }

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    # Create default demo project if empty
    if not projects:
        default_p = Project(
            id="prj_demo",
            name="SpiceHub Lab Assessment",
            description="Isolated staging infrastructure assessment",
            scope_json=json.dumps({"cidrs": ["10.77.0.0/24"], "lab_only": True}),
            created_by="system",
            created_at=utcnow_str()
        )
        db.add(default_p)
        db.commit()
        projects = [default_p]

    res = []
    for p in projects:
        res.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "scope": json.loads(p.scope_json or "{}"),
            "created_by": p.created_by,
            "created_at": p.created_at
        })
    return res

@router.get("/{id}")
def get_project(id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "scope": json.loads(p.scope_json or "{}"),
        "created_by": p.created_by,
        "created_at": p.created_at
    }

@router.put("/{id}", response_model=ProjectResponse)
def update_project(id: str, req: ProjectCreate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p.name = req.name
    p.description = req.description or ""
    p.scope_json = json.dumps(req.scope.model_dump())
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "scope": json.loads(p.scope_json or "{}"),
        "created_by": p.created_by,
        "created_at": p.created_at
    }


@router.get("/{id}/stats")
def get_project_stats(id: str, db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.project_id == id).all()
    findings = db.query(Finding).filter(Finding.project_id == id).all()
    chains = db.query(Chain).filter(Chain.project_id == id).all()
    pending_approvals = db.query(ApprovalCard).filter(ApprovalCard.status == "pending").count()

    by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    by_stage = {"recon": 0, "config": 0, "vuln": 0}

    for f in findings:
        sev = f.severity.lower()
        if sev in by_severity:
            by_severity[sev] += 1
        stg = f.stage.lower()
        if stg in by_stage:
            by_stage[stg] += 1

    target_assets = []
    crown_jewels = []

    for a in assets:
        props = {}
        if a.props_json:
            try:
                props = json.loads(a.props_json)
            except Exception:
                props = {}

        a_findings = [f for f in findings if f.asset_id == a.id]
        crit_count = sum(1 for f in a_findings if f.severity.lower() == "critical")
        high_count = sum(1 for f in a_findings if f.severity.lower() == "high")
        med_count = sum(1 for f in a_findings if f.severity.lower() == "medium")
        low_count = sum(1 for f in a_findings if f.severity.lower() == "low")

        raw_risk = crit_count * 35 + high_count * 20 + med_count * 10 + low_count * 3
        risk_pct = min(100, max(25 if a_findings else 10, raw_risk))

        services = props.get("services", [])
        if services and isinstance(services, list):
            tech_parts = [f"{s.get('product', s.get('proto', 'svc')).capitalize()}" for s in services if isinstance(s, dict)]
            tech = " / ".join(tech_parts) if tech_parts else (a.type or "Node")
        else:
            tech = a.type or "Internal Node"

        color = "#ef4444" if (crit_count > 0 or high_count > 0) else "#f59e0b" if med_count > 0 else "#10b981"

        status_parts = []
        if crit_count: status_parts.append(f"{crit_count} Crit")
        if high_count: status_parts.append(f"{high_count} High")
        if med_count: status_parts.append(f"{med_count} Med")
        status_desc = f"{len(a_findings)} findings" + (f" ({', '.join(status_parts)})" if status_parts else "")

        target_assets.append({
            "id": a.id,
            "name": f"{a.name} ({a.zone.upper() if a.zone else 'Lab'})",
            "tech": tech,
            "progress": risk_pct,
            "color": color,
            "status": status_desc,
            "findings_count": len(a_findings),
            "ip": props.get("ip", "10.77.0.x"),
            "zone": a.zone or "lab"
        })

        datastores = props.get("datastores", [])
        is_jewel = bool(datastores) or ("git" in a.name.lower()) or (a.zone == "internal")
        if is_jewel:
            tag = "Synthetic DB" if datastores else "Decoy SCM" if "git" in a.name.lower() else "Internal Core"
            crown_jewels.append({
                "name": a.name,
                "id": f"#{a.id}",
                "tag": tag,
                "ip": props.get("ip", "10.77.0.x"),
                "findings": len(a_findings)
            })

    return {
        "assets": len(assets),
        "findings": len(findings),
        "by_severity": by_severity,
        "by_stage": by_stage,
        "chains": len(chains),
        "pending_approvals": pending_approvals,
        "verified_chains": len([c for c in chains if c.status == "confirmed"]),
        "noise_reduction_percent": round((1.0 - (len(chains) / max(1, len(findings)))) * 100, 1) if findings else 0.0,
        "target_assets": target_assets,
        "crown_jewels": crown_jewels
    }

