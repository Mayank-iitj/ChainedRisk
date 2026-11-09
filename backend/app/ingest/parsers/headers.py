import json
from typing import List, Dict, Any
from urllib.parse import urlparse
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class HeadersParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        text = content.decode("utf-8", errors="replace")
        records = []
        try:
            data = json.loads(text)
        except Exception:
            return records

        target = data.get("target", data.get("url", "app.lab"))
        parsed = urlparse(target if "://" in target else f"http://{target}")
        asset_name = parsed.hostname or target

        missing = data.get("missing_headers", data.get("missing", []))
        for h in missing:
            h_name = h if isinstance(h, str) else h.get("name", "Unknown Header")
            records.append(NormalizedRecord(
                asset_name=asset_name,
                asset_type="Host",
                asset_zone="dmz",
                asset_props={"target": target},
                title=f"Missing Security Header: {h_name}",
                stage="config",
                severity="low",
                cvss=3.0,
                source_tool="headers",
                rule_id=f"missing-header-{h_name.lower()}",
                evidence={"header": h_name, "target": target},
                provides=[],
                requires=[],
                tags=["headers", "hardening", h_name.lower()],
                confidence=1.0
            ))
        return records

