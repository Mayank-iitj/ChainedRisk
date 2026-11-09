import json
from typing import List, Dict, Any, Set
from sqlalchemy.orm import Session
from backend.app.models.db_models import Chain, ChainStep, Finding

def compute_min_cut_remediation(project_id: str, db: Session) -> List[Dict[str, Any]]:
    """
    Greedy set cover algorithm to find the minimum set of findings
    that cuts the maximum number of attack chains.
    """
    chains = db.query(Chain).filter(Chain.project_id == project_id).all()
    if not chains:
        return []

    # Map chain_id -> set of finding_ids
    chain_findings: Dict[str, Set[str]] = {}
    chain_scores: Dict[str, int] = {}
    for c in chains:
        chain_scores[c.id] = c.score
        steps = db.query(ChainStep).filter(ChainStep.chain_id == c.id).all()
        fids = set()
        for s in steps:
            fids.update(json.loads(s.finding_ids_json or "[]"))
        chain_findings[c.id] = fids

    uncovered_chains = set(chain_findings.keys())
    selected_fixes = []

    # All unique findings across chains
    all_fids = set()
    for fids in chain_findings.values():
        all_fids.update(fids)

    # Finding details
    findings_map = {f.id: f for f in db.query(Finding).filter(Finding.id.in_(all_fids)).all()}

    while uncovered_chains:
        best_fid = None
        best_count = -1
        best_broken_chains = []

        for fid in all_fids:
            # Check how many uncovered chains this finding breaks
            broken = [cid for cid in uncovered_chains if fid in chain_findings[cid]]
            if len(broken) > best_count:
                best_count = len(broken)
                best_fid = fid
                best_broken_chains = broken

        if not best_fid or best_count == 0:
            break

        f_obj = findings_map.get(best_fid)
        f_title = f_obj.title if f_obj else best_fid

        action = f"Remediate {f_title}"
        effort = "Low" if "git" in best_fid or "header" in best_fid else "Medium"
        if "ssrf" in best_fid:
            action = "Implement strict CIDR egress filtering on /fetch proxy"
            effort = "Low"
        elif "redis" in best_fid:
            action = "Enable Redis REQUIREPASS and bind to 127.0.0.1"
            effort = "Low"

        selected_fixes.append({
            "finding_id": best_fid,
            "title": f_title,
            "action": action,
            "effort": effort,
            "breaks_chains_count": len(best_broken_chains),
            "breaks_chains": best_broken_chains,
            "risk_eliminated": sum(chain_scores.get(cid, 0) for cid in best_broken_chains)
        })

        uncovered_chains.difference_update(best_broken_chains)

    return selected_fixes

