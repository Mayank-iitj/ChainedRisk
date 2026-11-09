import xml.etree.ElementTree as ET
import re
from typing import List, Dict, Any
from backend.app.ingest.parsers.base import BaseParser, NormalizedRecord

class NmapParser(BaseParser):
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        text = content.decode("utf-8", errors="replace")
        records = []

        # Check if XML
        if text.strip().startswith("<?xml") or "<nmaprun" in text:
            try:
                root = ET.fromstring(text)
                for host in root.findall("host"):
                    status = host.find("status")
                    if status is not None and status.get("state") != "up":
                        continue

                    # IP and hostname
                    ip = ""
                    for addr in host.findall("address"):
                        if addr.get("addrtype") == "ipv4":
                            ip = addr.get("addr", "")

                    hostname = ""
                    hostnames = host.find("hostnames")
                    if hostnames is not None:
                        hn = hostnames.find("hostname")
                        if hn is not None:
                            hostname = hn.get("name", "")
                    asset_name = hostname or ip or "unknown-host"

                    ports = host.find("ports")
                    if ports is not None:
                        for port in ports.findall("port"):
                            state = port.find("state")
                            if state is not None and state.get("state") == "open":
                                portid = port.get("portid")
                                proto = port.get("protocol", "tcp")
                                service = port.find("service")
                                s_name = service.get("name", "service") if service is not None else "service"
                                product = service.get("product", "") if service is not None else ""
                                version = service.get("version", "") if service is not None else ""

                                title = f"Open {proto.upper()} Port: {portid}/{s_name}"
                                evidence = {
                                    "port": portid,
                                    "protocol": proto,
                                    "service": s_name,
                                    "product": product,
                                    "version": version
                                }

                                provides = ["recon_info"]
                                if portid == "6379" or "redis" in s_name.lower():
                                    provides.append("internal_service_access")

                                records.append(NormalizedRecord(
                                    asset_name=asset_name,
                                    asset_type="Host",
                                    asset_ip=ip,
                                    asset_zone="lab" if ".lab" in asset_name or ip.startswith("10.77.") else "internal",
                                    asset_props={"open_ports": [f"{portid}/{proto}"]},
                                    title=title,
                                    stage="recon",
                                    severity="info" if portid in {"80", "443"} else "low",
                                    cvss=2.0,
                                    source_tool="nmap",
                                    rule_id=f"nmap-open-port-{portid}",
                                    evidence=evidence,
                                    provides=provides,
                                    requires=[],
                                    tags=["recon", "open-port", s_name],
                                    confidence=1.0
                                ))
                return records
            except Exception:
                pass

        # Text/grepable fallback
        lines = text.split("\n")
        current_host = "target.lab"
        for line in lines:
            if "Nmap scan report for" in line:
                parts = line.split("for")[-1].strip().split()
                current_host = parts[0]
            m = re.match(r"^(\d+)/(tcp|udp)\s+open\s+(\S+)", line.strip())
            if m:
                port, proto, service = m.groups()
                records.append(NormalizedRecord(
                    asset_name=current_host,
                    asset_type="Host",
                    asset_ip="",
                    asset_zone="lab" if ".lab" in current_host else "internal",
                    title=f"Open {proto.upper()} Port: {port}/{service}",
                    stage="recon",
                    severity="low",
                    cvss=2.0,
                    source_tool="nmap",
                    rule_id=f"nmap-port-{port}",
                    evidence={"port": port, "service": service},
                    provides=["recon_info"],
                    requires=[],
                    tags=["recon", "open-port", service]
                ))

        return records

