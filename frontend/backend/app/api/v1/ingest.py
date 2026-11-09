import json
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import Project, Finding, Asset, utcnow_str
from backend.app.models.schemas import FindingCreate, FindingResponse
from backend.app.ingest.normalizer import process_ingest

router = APIRouter(tags=["ingest"])

SEED_DEMO_PATH = Path(__file__).resolve().parents[4] / "seed" / "demo_scenario.json"

@router.post("/projects/{id}/ingest")
async def ingest_files(
    id: str,
    files: List[UploadFile] = File(...),
    source_tool: str = Form("auto"),
    stage: str = Form("auto"),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    job_id = f"job_{uuid.uuid4().hex[:8]}"
    total_assets = 0
    total_findings = 0
    total_dupes = 0

    for file in files:
        content = await file.read()
        res = process_ingest(
            db=db,
            project_id=id,
            file_bytes=content,
            source_tool=source_tool,
            filename=file.filename or "",
            actor="analyst"
        )
        total_assets += res["assets_created"]
        total_findings += res["findings_created"]
        total_dupes += res["duplicates"]

    return {
        "job_id": job_id,
        "status": "done",
        "progress": 100,
        "result": {
            "files": len(files),
            "assets_created": total_assets,
            "findings_created": total_findings,
            "duplicates": total_dupes,
            "duplicates_skipped": total_dupes,
            "secrets_redacted_count": 0,
            "errors": []
        }
    }

@router.post("/seed/load-demo")
def load_demo_seed(project_id: str = "prj_demo", db: Session = Depends(get_db)):
    """Loads the pre-baked demo scenario (.git + SSRF + Redis) into the project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        project = Project(
            id=project_id,
            name="Production Assessment Enclave",
            description="Isolated enterprise microservice assessment",
            scope_json=json.dumps({"cidrs": ["10.77.0.0/24"], "lab_only": True}),
            created_by="system",
            created_at=utcnow_str()
        )
        db.add(project)
        db.commit()

    if not SEED_DEMO_PATH.exists():
        raise HTTPException(status_code=404, detail=f"Seed file not found at {SEED_DEMO_PATH}")

    with open(SEED_DEMO_PATH, "rb") as f:
        content = f.read()

    res = process_ingest(
        db=db,
        project_id=project_id,
        file_bytes=content,
        source_tool="native",
        filename="demo_scenario.json",
        actor="system"
    )
    return {
        "message": "Demo scenario loaded successfully",
        "project_id": project_id,
        "result": res
    }

@router.get("/projects/{id}/findings", response_model=List[FindingResponse])
def get_findings(
    id: str,
    stage: Optional[str] = None,
    severity: Optional[str] = None,
    asset_id: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Finding).filter(Finding.project_id == id)
    if stage:
        query = query.filter(Finding.stage == stage)
    if severity:
        query = query.filter(Finding.severity == severity)
    if asset_id:
        query = query.filter(Finding.asset_id == asset_id)
    if q:
        query = query.filter(Finding.title.ilike(f"%{q}%"))

    findings = query.all()
    res = []
    for f in findings:
        res.append({
            "id": f.id,
            "project_id": f.project_id,
            "asset_id": f.asset_id,
            "title": f.title,
            "stage": f.stage,
            "severity": f.severity,
            "cvss": f.cvss,
            "source_tool": f.source_tool,
            "rule_id": f.rule_id,
            "evidence": json.loads(f.evidence_json or "{}"),
            "provides": json.loads(f.provides_json or "[]"),
            "requires": json.loads(f.requires_json or "[]"),
            "cwe": json.loads(f.cwe_json or "[]"),
            "attack": json.loads(f.attack_json or "[]"),
            "confidence": f.confidence,
            "first_seen": f.first_seen
        })
    return res

