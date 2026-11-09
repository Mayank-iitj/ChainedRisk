import hashlib
import json
import uuid
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from backend.app.core.security import redact_text
from backend.app.core.audit import canonical_json, compute_event_hash, GENESIS_HASH
from backend.app.models.db_models import Asset, Finding, Edge, AuditEvent, utcnow_str
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord
from backend.app.ingest.parsers.native import NativeJsonParser
from backend.app.ingest.parsers.nuclei import NucleiParser
from backend.app.ingest.parsers.nmap import NmapParser
from backend.app.ingest.parsers.httpx import HttpxParser
from backend.app.ingest.parsers.gitleaks import GitleaksParser
from backend.app.ingest.parsers.headers import HeadersParser
from backend.app.ingest.parsers.csv_parser import CsvParser

PARSER_REGISTRY: Dict[str, BaseParser] = {
    "native": NativeJsonParser(),
    "json": NativeJsonParser(),
    "nuclei": NucleiParser(),
    "nmap": NmapParser(),
    "httpx": HttpxParser(),
    "gitleaks": GitleaksParser(),
    "headers": HeadersParser(),
    "csv": CsvParser(),
}

def detect_tool(content: bytes, filename: str = "") -> str:
    text = content[:4096].decode("utf-8", errors="replace").strip()
    fn_lower = filename.lower()
    if fn_lower.endswith(".csv"):
        return "csv"
    if "nmap" in fn_lower or text.startswith("<?xml") or "<nmaprun" in text or "Nmap scan report" in text:
        return "nmap"
    if "gitleaks" in fn_lower:
        return "gitleaks"
    if "httpx" in fn_lower:
        return "httpx"
    if "nuclei" in fn_lower or '"template-id"' in text or '"templateID"' in text:
        return "nuclei"
    if "headers" in fn_lower or '"missing_headers"' in text:
        return "headers"
    if '"findings"' in text and '"assets"' in text:
        return "native"
    return "nuclei" # fallback

def process_ingest(
    db: Session,
    project_id: str,
    file_bytes: bytes,
    source_tool: str = "auto",
    filename: str = "",
    actor: str = "system"
) -> Dict[str, Any]:
    if source_tool == "auto":
        source_tool = detect_tool(file_bytes, filename)

    parser = PARSER_REGISTRY.get(source_tool, PARSER_REGISTRY["nuclei"])
    records: List[NormalizedRecord] = parser.parse(file_bytes, {"filename": filename})

    created_assets = 0
    created_findings = 0
    duplicates = 0

    # Cache existing assets for this project
    existing_assets = {a.name: a for a in db.query(Asset).filter(Asset.project_id == project_id).all()}

    for rec in records:
        # Resolve or create Asset
        asset = existing_assets.get(rec.asset_name)
        if not asset:
            # Deterministic ID for demo consistency or unique ID per project
            if project_id == "prj_demo":
                if rec.asset_name == "app.lab":
                    asset_id = "ast_app"
                elif rec.asset_name == "git.lab":
                    asset_id = "ast_git"
                elif rec.asset_name == "redis.lab":
                    asset_id = "ast_redis"
                else:
                    asset_id = f"ast_{uuid.uuid4().hex[:8]}"
            else:
                asset_id = f"ast_{project_id[:10]}_{uuid.uuid4().hex[:8]}"

            # If asset_id already exists in another project, make sure it is unique
            if db.query(Asset).filter(Asset.id == asset_id).first():
                asset_id = f"ast_{project_id[:10]}_{uuid.uuid4().hex[:8]}"

            asset = Asset(
                id=asset_id,
                project_id=project_id,
                type=rec.asset_type,
                name=rec.asset_name,
                zone=rec.asset_zone,
                props_json=json.dumps(rec.asset_props)
            )
            db.add(asset)
            db.flush()
            existing_assets[rec.asset_name] = asset
            created_assets += 1

        # Redact evidence snippet
        ev = rec.evidence.copy()
        if "response_snippet" in ev:
            ev["response_snippet"] = redact_text(str(ev["response_snippet"]))
        if "raw_row" in ev:
            ev["raw_row"] = {k: redact_text(str(v)) for k, v in ev["raw_row"].items()}

        ev_digest = hashlib.sha256(canonical_json(ev).encode('utf-8')).hexdigest()
        dedup_key = hashlib.sha256(f"{project_id}|{source_tool}|{rec.rule_id}|{asset.id}|{ev_digest}".encode('utf-8')).hexdigest()

        # Check duplicate
        exists = db.query(Finding).filter(Finding.dedup_key == dedup_key).first()
        if exists:
            duplicates += 1
            continue

        finding_id = rec.record_id or f"fnd_{uuid.uuid4().hex[:8]}"
        # If ID already exists in DB, generate fresh unique ID
        if db.query(Finding).filter(Finding.id == finding_id).first():
            finding_id = f"fnd_{uuid.uuid4().hex[:8]}"

        finding = Finding(
            id=finding_id,
            project_id=project_id,
            asset_id=asset.id,
            title=rec.title,
            stage=rec.stage,
            severity=rec.severity,
            cvss=rec.cvss,
            source_tool=source_tool,
            rule_id=rec.rule_id,
            evidence_json=json.dumps(ev),
            provides_json=json.dumps(rec.provides),
            requires_json=json.dumps(rec.requires),
            cwe_json=json.dumps(rec.cwe),
            attack_json=json.dumps(rec.attack),
            dedup_key=dedup_key,
            confidence=rec.confidence,
            first_seen=utcnow_str()
        )
        db.add(finding)

        # Create HAS_FINDING edge
        edge_id = f"edg_{uuid.uuid4().hex[:8]}"
        edge = Edge(
            id=edge_id,
            project_id=project_id,
            src=asset.id,
            dst=finding_id,
            type="HAS_FINDING",
            props_json=json.dumps({"severity": rec.severity}),
            derived=0
        )
        db.add(edge)
        created_findings += 1

    # Record Audit Event with hash chain
    last_audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_audit.hash if last_audit else GENESIS_HASH
    ts = utcnow_str()
    event_payload = {
        "project_id": project_id,
        "source_tool": source_tool,
        "filename": filename,
        "assets_created": created_assets,
        "findings_created": created_findings,
        "duplicates": duplicates
    }
    payload_str = canonical_json(event_payload)
    ev_hash = compute_event_hash(prev_hash, ts, actor, "INGEST_COMPLETED", payload_str)

    audit_entry = AuditEvent(
        ts=ts,
        actor=actor,
        type="INGEST_COMPLETED",
        payload_json=payload_str,
        prev_hash=prev_hash,
        hash=ev_hash
    )
    db.add(audit_entry)
    db.commit()

    return {
        "files": 1,
        "source_tool": source_tool,
        "assets_created": created_assets,
        "findings_created": created_findings,
        "duplicates": duplicates,
        "errors": []
    }
