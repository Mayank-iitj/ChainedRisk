from abc import ABC, abstractmethod
from typing import List, Dict, Any

class NormalizedRecord:
    def __init__(
        self,
        asset_name: str,
        asset_type: str = "Host",
        asset_ip: str = "",
        asset_zone: str = "internal",
        asset_props: Dict[str, Any] = None,
        title: str = "",
        stage: str = "recon", # recon, config, vuln
        severity: str = "info", # info, low, medium, high, critical
        cvss: float = 0.0,
        source_tool: str = "unknown",
        rule_id: str = "",
        evidence: Dict[str, Any] = None,
        provides: List[str] = None,
        requires: List[str] = None,
        tags: List[str] = None,
        cwe: List[str] = None,
        attack: List[str] = None,
        confidence: float = 1.0,
        record_id: str = None,
    ):
        self.record_id = record_id
        self.asset_name = asset_name
        self.asset_type = asset_type
        self.asset_ip = asset_ip
        self.asset_zone = asset_zone
        self.asset_props = asset_props or {}
        self.title = title
        self.stage = stage
        self.severity = severity
        self.cvss = cvss
        self.source_tool = source_tool
        self.rule_id = rule_id
        self.evidence = evidence or {}
        self.provides = provides or []
        self.requires = requires or []
        self.tags = tags or []
        self.cwe = cwe or []
        self.attack = attack or []
        self.confidence = confidence

class BaseParser(ABC):
    @abstractmethod
    def parse(self, content: bytes, meta: Dict[str, Any] = None) -> List[NormalizedRecord]:
        pass
