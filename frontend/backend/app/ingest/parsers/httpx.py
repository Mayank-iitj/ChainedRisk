import json
from typing import List, Dict, Any
from urllib.parse import urlparse
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class HttpxParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        text = content.decode("utf-8", errors="replace")
        records = []
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue

            url = data.get("url", "")
            parsed = urlparse(url)
            asset_name = parsed.hostname or url or "web-host"
            status_code = data.get("status_code", data.get("status-code", 200))
            title = data.get("title", f"Web Service {status_code}")
            technologies = data.get("tech", data.get("technologies", []))

            evidence = {
                "url": url,
                "status_code": status_code,
                "title": title,
                "technologies": technologies,
                "webserver": data.get("webserver", "")
            }

            records.append(NormalizedRecord(
                asset_name=asset_name,
                asset_type="Host",
                asset_ip=data.get("host", ""),
                asset_zone="lab" if ".lab" in asset_name else "dmz",
                asset_props={"url": url, "technologies": technologies},
                title=f"Discovered Web Service: {url} ({status_code})",
                stage="recon",
                severity="info",
                cvss=0.0,
                source_tool="httpx",
                rule_id="httpx-endpoint-discovery",
                evidence=evidence,
                provides=["recon_info"],
                requires=[],
                tags=["web", "discovery"] + (technologies if isinstance(technologies, list) else [])
            ))
        return records

