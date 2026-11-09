import math
from typing import List, Dict, Any, Tuple

CAPABILITY_IMPACT = {
    "rce": 1.0,
    "code_exec_possible": 1.0,
    "data_exfil": 0.9,
    "credential_disclosure": 0.8,
    "data_write": 0.8,
    "priv_esc": 0.8,
    "data_read": 0.6,
    "net_pivot_internal": 0.5,
    "dos": 0.4,
    "internal_url_disclosure": 0.2,
    "source_repo_access": 0.3,
    "recon_info": 0.1,
}

EXPLOITABILITY_WEIGHTS = {
    "trivial": 0.9,
    "easy": 0.7,
    "moderate": 0.4,
    "hard": 0.15,
}

SEVERITY_VALUES = {
    "critical": 95,
    "high": 75,
    "medium": 50,
    "low": 25,
    "info": 10,
}

def calculate_chain_score(steps: List[Dict[str, Any]], findings_by_id: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes likelihood L = prod(p_i), terminal impact I,
    chain_score = round(100 * (0.6*I + 0.4*L^(1/n))),
    max_individual_severity, and chain_gain.
    """
    if not steps:
        return {
            "score": 0,
            "severity": "low",
            "likelihood": 0.0,
            "impact": 0.0,
            "chain_gain": 0,
            "max_individual_severity": "low"
        }

    n = len(steps)
    step_likelihoods = []
    max_indiv_score = 0
    max_indiv_sev = "low"

    all_terminal_capabilities = []

    for idx, step in enumerate(steps):
        finding_ids = step.get("finding_ids", [])
        # Find findings
        step_findings = [findings_by_id[fid] for fid in finding_ids if fid in findings_by_id]

        p_i = 0.7 # default easy/moderate
        conf = 1.0

        for f in step_findings:
            sev = getattr(f, "severity", "medium").lower()
            val = SEVERITY_VALUES.get(sev, 25)
            if val > max_indiv_score:
                max_indiv_score = val
                max_indiv_sev = sev

            # Check tags for exploitability
            tags = []
            if hasattr(f, "tags_json"):
                import json
                tags = json.loads(getattr(f, "tags_json", "[]") or "[]")
            if hasattr(f, "attack_json"):
                import json
                tags.extend(json.loads(getattr(f, "attack_json", "[]") or "[]"))

            rule_id_lower = getattr(f, "rule_id", "").lower()
            title_lower = getattr(f, "title", "").lower()

            if "trivial" in tags or "unauth" in tags or "unauth" in rule_id_lower or "redis-unauth" in rule_id_lower:
                p_i = 0.9
            elif "easy" in tags or "git" in rule_id_lower or "ssrf" in rule_id_lower:
                p_i = 0.8
            elif sev == "low":
                p_i = 0.9
            elif "moderate" in tags:
                p_i = 0.5
            elif "hard" in tags:
                p_i = 0.2

            conf = min(conf, getattr(f, "confidence", 1.0))

        step_likelihoods.append(p_i * conf)

        if idx == n - 1:
            all_terminal_capabilities.extend(step.get("provides", []))

    # L = prod(p_i)
    L = 1.0
    for p in step_likelihoods:
        L *= p

    # Terminal impact I
    terminal_impacts = [CAPABILITY_IMPACT.get(cap, 0.3) for cap in all_terminal_capabilities]
    I = max(terminal_impacts) if terminal_impacts else 0.5

    # geometric mean likelihood L^(1/n)
    geom_L = math.pow(max(0.0001, L), 1.0 / max(1, n))

    raw_score = 100.0 * (0.6 * I + 0.4 * geom_L)
    score = int(round(raw_score))
    score = max(0, min(100, score))

    chain_gain = max(0, score - max_indiv_score)

    if score >= 80:
        severity = "critical"
    elif score >= 60:
        severity = "high"
    elif score >= 40:
        severity = "medium"
    else:
        severity = "low"

    return {
        "score": score,
        "severity": severity,
        "likelihood": round(L, 3),
        "impact": round(I, 2),
        "chain_gain": chain_gain,
        "max_individual_severity": max_indiv_sev
    }
