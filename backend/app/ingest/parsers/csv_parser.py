import csv
import io
from typing import List, Dict, Any
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class CsvParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        text = content.decode("utf-8", errors="replace")
        records = []
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            # Map standard columns
            asset_name = row.get("asset") or row.get("host") or row.get("target") or "unknown-host"
            title = row.get("title") or row.get("name") or row.get("vulnerability") or "Unnamed Finding"
            severity = (row.get("severity") or "medium").lower()
            stage = (row.get("stage") or "vuln").lower()
            cvss = float(row.get("cvss") or 5.0)
            rule_id = row.get("rule_id") or row.get("cve") or "csv-rule"
            source_tool = row.get("tool") or row.get("source") or "csv"

            records.append(NormalizedRecord(
                asset_name=asset_name,
                asset_type="Host",
                asset_zone="internal",
                title=title,
                stage=stage,
                severity=severity,
                cvss=cvss,
                source_tool=source_tool,
                rule_id=rule_id,
                evidence={"raw_row": row},
                provides=[],
                requires=[],
                tags=["csv-imported"],
                confidence=0.8
            ))
        return records

