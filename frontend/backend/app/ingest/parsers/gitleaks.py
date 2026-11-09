import json
from typing import List, Dict, Any
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class GitleaksParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        text = content.decode("utf-8", errors="replace")
        records = []
        try:
            data = json.loads(text)
            if not isinstance(data, list):
                data = [data]
        except Exception:
            return records

        for item in data:
            rule_id = item.get("RuleID", item.get("rule", "leaked-secret"))
            desc = item.get("Description", rule_id)
            file_path = item.get("File", "")
            commit = item.get("Commit", "")
            secret = item.get("Secret", "")
            match = item.get("Match", "")

            evidence = {
                "file": file_path,
                "commit": commit,
                "secret_sample": (secret[:4] + "****" + secret[-4:]) if len(secret) > 8 else "****",
                "match": match
            }

            records.append(NormalizedRecord(
                asset_name="git.lab",
                asset_type="Host",
                asset_zone="internal",
                asset_props={"repo_file": file_path},
                title=f"Leaked Secret: {desc} in {file_path}",
                stage="config",
                severity="high",
                cvss=7.5,
                source_tool="gitleaks",
                rule_id=rule_id,
                evidence=evidence,
                provides=["credential_disclosure", "internal_service_access"],
                requires=["source_repo_access"],
                tags=["secret", "credential", "leak"],
                confidence=0.95
            ))
        return records

