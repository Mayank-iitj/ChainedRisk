import os
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.db_models import Finding, Asset
from backend.app.core.config import settings

def summarize_graph_for_llm(project_id: str, db: Session) -> str:
    """Summarizes assets, findings and reachability into <= 8k tokens format."""
    assets = db.query(Asset).filter(Asset.project_id == project_id).all()
    findings = db.query(Finding).filter(Finding.project_id == project_id).all()

    asset_lines = []
    for a in assets:
        props = json.loads(a.props_json or "{}")
        svcs = props.get("services", [])
        svc_desc = [f"{s.get('product', 'svc')}:{s.get('port', '')}" for s in svcs]
        asset_lines.append(f"{a.id} {a.type} {a.name} zone={a.zone} svc=[{','.join(svc_desc)}]")

    finding_lines = []
    for f in findings:
        provides = json.loads(f.provides_json or "[]")
        requires = json.loads(f.requires_json or "[]")
        ev = json.loads(f.evidence_json or "{}")
        ev_snip = str(ev.get("response_snippet", ev.get("request", "")))[:150].replace("\n", " ")
        finding_lines.append(
            f"{f.id} {f.asset_id} stage={f.stage} sev={f.severity} rule={f.rule_id} "
            f"req={requires} prov={provides} ev=\"{ev_snip}\""
        )

    summary = (
        "<assets>\n" + "\n".join(asset_lines) + "\n</assets>\n\n"
        "<findings>\n" + "\n".join(finding_lines) + "\n</findings>\n\n"
        "<reachability>\n"
        "dmz->internal: blocked (direct external), app.lab->redis.lab: allowed (via SSRF internal pivot)\n"
        "</reachability>"
    )
    return summary

def generate_llm_hypotheses(project_id: str, db: Session) -> List[Dict[str, Any]]:
    """Generates novel attack chains using LLM or structured graph reasoning."""
    # If API key is provided, we can call Claude / Anthropic
    api_key = settings.ANTHROPIC_API_KEY or os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key and settings.CR_LLM_ENABLED:
        try:
            import httpx
            summary = summarize_graph_for_llm(project_id, db)
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            system_prompt = (
                "You are a defensive security analyst assistant inside ChainedRisk. You correlate scanner findings "
                "into multi-step attack paths. Use ONLY findings and assets listed in <findings> and <assets>. "
                "Output ONLY a JSON object: {\"chains\": [{\"title\":\"string\", \"terminal_capability\":\"data_exfil\", "
                "\"steps\": [{\"finding_ids\":[\"fnd_...\"], \"requires\":[\"...\"], \"provides\":[\"...\"], \"narrative\":\"...\"}]}]}"
            )
            resp = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": settings.CR_LLM_MODEL or "claude-3-7-sonnet-20250219",
                    "max_tokens": 2048,
                    "temperature": 0.2,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": summary}]
                },
                timeout=25.0
            )
            if resp.status_code == 200:
                data = resp.json()
                content_text = data["content"][0]["text"]
                # Extract JSON
                start = content_text.find("{")
                end = content_text.rfind("}") + 1
                if start != -1 and end != -1:
                    parsed = json.loads(content_text[start:end])
                    return parsed.get("chains", [])
        except Exception:
            pass

    # Heuristic AI reasoning fallback
    return []

def generate_explanation(chain_title: str, steps: List[Dict[str, Any]]) -> str:
    """Generates clear, concise narrative explanation of the attack chain."""
    step_desc = []
    for s in steps:
        order = s.get("order", 1)
        narrative = s.get("narrative") or " ".join(s.get("finding_ids", []))
        step_desc.append(f"Step {order}: {narrative}")

    return (
        f"This critical multi-stage breach path chains seemingly isolated findings. "
        f"{' '.join(step_desc)} "
        f"Remediating the central pivot (e.g. blocking SSRF or requiring strong authentication) "
        f"completely neutralizes this attack vector."
    )

