import hashlib
import json
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.db_models import Chain, ChainStep, Finding, Asset, VerificationPlan, VerificationStep, utcnow_str
from backend.app.verify.catalog import ACTION_CATALOG

def compute_command_hash(command_preview: str) -> str:
    h = hashlib.sha256(command_preview.strip().encode('utf-8')).hexdigest()
    return f"sha256:{h}"

def calculate_blast_radius(target_asset: str, risk_level: str) -> Dict[str, Any]:
    score = 15 if risk_level == "L1" else 35
    if "redis" in target_asset.lower():
        score = 28
        reachable = ["ast_app", "ast_redis"]
        datastores = [{"id": "ds_cache", "sensitivity": "synthetic"}]
    elif "git" in target_asset.lower():
        score = 20
        reachable = ["ast_app", "ast_git"]
        datastores = [{"id": "ds_git", "sensitivity": "synthetic"}]
    else:
        score = 12
        reachable = ["ast_app"]
        datastores = []

    return {
        "score": score,
        "reachable_assets": reachable,
        "datastores": datastores,
        "credentials_in_scope": 0,
        "state_change": "none" if risk_level == "L1" else "reversible",
        "network_scope": "lab-only"
    }

def create_verification_plan(chain_id: str, db: Session) -> Dict[str, Any]:
    chain = db.query(Chain).filter(Chain.id == chain_id).first()
    if not chain:
        raise ValueError(f"Chain {chain_id} not found")

    steps = db.query(ChainStep).filter(ChainStep.chain_id == chain_id).order_by(ChainStep.ord.asc()).all()

    # Clear prior plans for this chain
    prior_plans = db.query(VerificationPlan).filter(VerificationPlan.chain_id == chain_id).all()
    for p in prior_plans:
        db.query(VerificationStep).filter(VerificationStep.plan_id == p.id).delete()
        db.delete(p)
    db.flush()

    plan_id = f"pln_{uuid.uuid4().hex[:8]}"
    plan = VerificationPlan(id=plan_id, chain_id=chain_id, created_at=utcnow_str())
    db.add(plan)
    db.flush()

    plan_steps = []

    for s in steps:
        fids = json.loads(s.finding_ids_json or "[]")
        findings = db.query(Finding).filter(Finding.id.in_(fids)).all()
        fid_first = fids[0] if fids else ""
        target_asset = findings[0].asset_id if findings else "ast_app"

        # Resolve asset properties dynamically
        target_asset_obj = db.query(Asset).filter(Asset.id == target_asset).first()
        t_name = target_asset_obj.name if target_asset_obj else "target.internal"
        t_props = json.loads(target_asset_obj.props_json or "{}") if target_asset_obj else {}
        t_ip = t_props.get("ip", "10.77.0.12")

        ing_asset = db.query(Asset).filter(Asset.project_id == chain.project_id, Asset.zone == "dmz").first()
        ing_props = json.loads(ing_asset.props_json or "{}") if ing_asset else {}
        ing_ip = ing_props.get("ip", "10.77.0.10")
        ing_name = ing_asset.name if ing_asset else "gateway.dmz"

        action = "http_get_probe"
        params = {"url": f"http://{ing_ip}:8080/"}
        cmd_preview = f"http_get_probe --url http://{ing_ip}:8080/"

        if "git" in fid_first.lower() or any("git" in f.rule_id.lower() for f in findings):
            action = "git_exposure_check"
            params = {"url": f"http://{ing_ip}:8080/.git/config"}
            cmd_preview = f"git_exposure_check --url http://{ing_ip}:8080/.git/config"
            target_asset = ing_asset.id if ing_asset else target_asset
        elif "ssrf" in fid_first.lower() or any("ssrf" in f.rule_id.lower() for f in findings):
            action = "ssrf_canary_probe"
            params = {
                "url": f"http://{ing_ip}:8080/fetch",
                "target_url": f"http://{t_ip}:6379/"
            }
            cmd_preview = f"ssrf_canary_probe --url http://{ing_ip}:8080/fetch?u=http://{t_ip}:6379/ --expect reachable"
            target_asset = target_asset_obj.id if target_asset_obj else target_asset
        elif "redis" in fid_first.lower() or any("redis" in f.rule_id.lower() for f in findings):
            action = "redis_unauth_ping"
            params = {"host": t_ip, "port": 6379}
            cmd_preview = f"redis_unauth_ping --host {t_ip} --port 6379 --expect PONG"
            target_asset = target_asset_obj.id if target_asset_obj else target_asset

        action_def = ACTION_CATALOG.get(action, ACTION_CATALOG["http_get_probe"])
        risk_level = action_def["risk_level"]
        cmd_hash = compute_command_hash(cmd_preview)
        blast = calculate_blast_radius(target_asset, risk_level)

        vstep_id = f"vst_{uuid.uuid4().hex[:8]}"
        vstep = VerificationStep(
            id=vstep_id,
            plan_id=plan_id,
            ord=s.ord,
            action=action,
            params_json=json.dumps(params),
            target_asset=target_asset,
            risk_level=risk_level,
            reversible=1 if action_def["reversible"] else 0,
            command_preview=cmd_preview,
            command_hash=cmd_hash,
            blast_json=json.dumps(blast),
            status="pending"
        )
        db.add(vstep)
        plan_steps.append({
            "id": vstep_id,
            "order": s.ord,
            "action": action,
            "params": params,
            "target": target_asset,
            "risk_level": risk_level,
            "reversible": action_def["reversible"],
            "command_preview": cmd_preview,
            "command_hash": cmd_hash,
            "approval_required": True if risk_level in {"L1", "L2"} else False,
            "blast_radius": blast
        })

    chain.status = "planned"
    db.commit()

    return {
        "plan_id": plan_id,
        "chain_id": chain_id,
        "steps": plan_steps
    }

