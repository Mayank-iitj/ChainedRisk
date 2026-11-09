import json
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.app.models.db_models import Finding, Asset, RejectedHypothesis, utcnow_str
from backend.app.chain.scoring import CAPABILITY_IMPACT

ALLOWED_CAPABILITIES = set(CAPABILITY_IMPACT.keys()) | {"attacker_external"}

def validate_chain_hypothesis(
    chain_data: Dict[str, Any],
    project_id: str,
    db: Session,
    log_rejections: bool = True
) -> Tuple[bool, List[str]]:
    """
    Validates an attack chain hypothesis against project findings and capability model.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    steps = chain_data.get("steps", [])

    if len(steps) < 2 or len(steps) > 6:
        errors.append(f"Invalid chain length: {len(steps)} (must be 2..6)")

    # Load all project findings
    all_findings = {f.id: f for f in db.query(Finding).filter(Finding.project_id == project_id).all()}

    accumulated_capabilities = {"attacker_external"}

    for idx, step in enumerate(steps):
        finding_ids = step.get("finding_ids", [])
        if not finding_ids:
            errors.append(f"Step {idx+1} has no finding_ids")
            continue

        # Check finding IDs exist
        step_findings = []
        for fid in finding_ids:
            if fid not in all_findings:
                errors.append(f"Step {idx+1} references non-existent finding ID: '{fid}'")
            else:
                step_findings.append(all_findings[fid])

        if not step_findings:
            continue

        # Check preconditions
        requires = set(step.get("requires", []))
        for req in requires:
            if req not in ALLOWED_CAPABILITIES:
                errors.append(f"Step {idx+1} requires unknown capability: '{req}'")
            if req not in accumulated_capabilities:
                errors.append(
                    f"Step {idx+1} requires capability '{req}' which has not been granted by prior steps "
                    f"(accumulated: {sorted(list(accumulated_capabilities))})"
                )

        # Check declared provides vs actual finding provides
        actual_allowed_provides = set()
        for f in step_findings:
            f_provides = json.loads(f.provides_json or "[]")
            actual_allowed_provides.update(f_provides)

        declared_provides = set(step.get("provides", []))
        for p in declared_provides:
            if p not in ALLOWED_CAPABILITIES:
                errors.append(f"Step {idx+1} provides unknown capability: '{p}'")
            if p not in actual_allowed_provides:
                errors.append(
                    f"Step {idx+1} declares provide '{p}' which is NOT provided by findings {finding_ids} "
                    f"(actual allows: {sorted(list(actual_allowed_provides))})"
                )

        accumulated_capabilities.update(declared_provides)

    is_valid = len(errors) == 0

    if not is_valid and log_rejections:
        try:
            import uuid
            rej = RejectedHypothesis(
                id=f"rej_{uuid.uuid4().hex[:8]}",
                project_id=project_id,
                payload_json=json.dumps(chain_data),
                reason="; ".join(errors),
                created_at=utcnow_str()
            )
            db.add(rej)
            db.commit()
        except Exception:
            db.rollback()

    return is_valid, errors

