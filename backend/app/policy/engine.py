import ipaddress
from typing import Dict, Any, Tuple
from backend.app.core.config import settings

class PolicyEngine:
    def __init__(self):
        self.kill_locked = False
        self.lock_reason = ""
        self.lab_network = ipaddress.ip_network(settings.CR_LAB_CIDR)

    def is_target_in_scope(self, target_ip_or_host: str) -> bool:
        if not target_ip_or_host:
            return False
        # If hostname ends with .lab or contains lab
        if "lab" in target_ip_or_host.lower():
            return True
        try:
            ip = ipaddress.ip_address(target_ip_or_host)
            return ip in self.lab_network
        except ValueError:
            return False

    def evaluate(self, step: Dict[str, Any], actor: str = "agent") -> Tuple[str, str]:
        """
        Evaluates policy on a verification step.
        Returns (decision, reason):
        decision in {"allow", "require_approval", "deny"}
        """
        if self.kill_locked:
            return "deny", f"Global kill switch active: {self.lock_reason or 'Emergency lockdown'}"

        target = step.get("target", {})
        target_ip = target.get("ip", "")
        target_asset = target.get("asset_id", "")
        target_host = target.get("container", target_asset)

        # Check scope
        if target_ip and not self.is_target_in_scope(target_ip):
            return "deny", f"Target IP {target_ip} is outside authorized lab scope {settings.CR_LAB_CIDR}"

        risk_level = step.get("risk_level", "L1")
        if risk_level == "L3":
            return "deny", "L3 destructive/exploit actions are permanently disabled"

        if risk_level == "L0":
            return "allow", "L0 passive read-only is pre-approved"

        if risk_level in {"L1", "L2"}:
            return "require_approval", f"{risk_level} active probe requires explicit human approval"

        return "deny", "Default deny policy"

    def activate_kill_switch(self, reason: str = "Admin triggered emergency kill switch"):
        self.kill_locked = True
        self.lock_reason = reason

    def reset_kill_switch(self):
        self.kill_locked = False
        self.lock_reason = ""

policy_engine = PolicyEngine()

