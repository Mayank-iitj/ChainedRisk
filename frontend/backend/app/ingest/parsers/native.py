import json
from typing import List, Dict, Any
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class NativeJsonParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        data = json.loads(content.decode("utf-8"))
        records = []
        assets_map = {a["id"]: a for a in data.get("assets", [])}

        for fnd in data.get("findings", []):
            asset_id = fnd.get("asset_id", "")
            asset_info = assets_map.get(asset_id, {})
            asset_name = asset_info.get("name", asset_id)
            asset_type = asset_info.get("type", "Host")
            asset_ip = asset_info.get("ip", "")
            asset_zone = asset_info.get("zone", "internal")

            records.append(NormalizedRecord(
                record_id=fnd.get("id"),
                asset_name=asset_name,
                asset_type=asset_type,
                asset_ip=asset_ip,
                asset_zone=asset_zone,
                asset_props=asset_info,
                title=fnd.get("title", "Unnamed Finding"),
                stage=fnd.get("stage", "vuln"),
                severity=fnd.get("severity", "medium").lower(),
                cvss=float(fnd.get("cvss", 0.0)),
                source_tool=fnd.get("source_tool", "native"),
                rule_id=fnd.get("rule_id", ""),
                evidence=fnd.get("evidence", {}),
                provides=fnd.get("provides", []),
                requires=fnd.get("requires", []),
                tags=fnd.get("tags", []),
                cwe=fnd.get("cwe", []),
                attack=fnd.get("attack", []),
                confidence=float(fnd.get("confidence", 1.0))
            ))
        return records
