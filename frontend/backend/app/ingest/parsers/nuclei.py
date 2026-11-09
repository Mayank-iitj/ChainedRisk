import json
from typing import List, Dict, Any
from urllib.parse import urlparse
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class NucleiParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        text = content.decode("utf-8", errors="replace")
        records = []

        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines:
            try:
                data = json.loads(line)
            except Exception:
                continue

            info = data.get("info", {})
            template_id = data.get("template-id", data.get("templateID", "nuclei-rule"))
            title = info.get("name", template_id)
            severity = info.get("severity", "medium").lower()
            if severity not in {"info", "low", "medium", "high", "critical"}:
                severity = "medium"

            matched_at = data.get("matched-at", data.get("host", ""))
            parsed_url = urlparse(matched_at if "://" in matched_at else f"http://{matched_at}")
            asset_name = parsed_url.hostname or matched_at or "unknown-host"

            tags = info.get("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",")]

            classification = info.get("classification", {})
            cwe = classification.get("cwe-id", [])
            if isinstance(cwe, str):
                cwe = [cwe]
            cve = classification.get("cve-id", [])
            if isinstance(cve, str):
                cve = [cve]

            evidence = {
                "matched_at": matched_at,
                "request": data.get("request", ""),
                "response_snippet": (data.get("response", "") or "")[:2000],
                "curl": data.get("curl-command", "")
            }

            # Map capabilities based on template and tags
            provides = []
            requires = []
            lower_title = title.lower()
            lower_template = template_id.lower()

            if "git" in lower_template or "git" in lower_title:
                provides.extend(["internal_url_disclosure", "source_repo_access"])
                stage = "config"
            elif "ssrf" in lower_template or "ssrf" in tags or "ssrf" in lower_title:
                requires.append("internal_url_disclosure")
                provides.append("net_pivot_internal")
                stage = "vuln"
            elif "redis" in lower_template or "redis" in lower_title:
                requires.append("net_pivot_internal")
                provides.extend(["data_read", "data_exfil", "code_exec_possible"])
                stage = "config"
            else:
                stage = "vuln"

            records.append(NormalizedRecord(
                asset_name=asset_name,
                asset_type="Host",
                asset_ip="",
                asset_zone="lab" if ".lab" in asset_name else "internal",
                asset_props={"matched_at": matched_at},
                title=title,
                stage=stage,
                severity=severity,
                cvss=float(classification.get("cvss-score", 5.0) or 5.0),
                source_tool="nuclei",
                rule_id=template_id,
                evidence=evidence,
                provides=provides,
                requires=requires,
                tags=tags,
                cwe=cwe,
                attack=cve,
                confidence=0.9
            ))

        return records

