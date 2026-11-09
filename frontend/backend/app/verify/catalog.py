from typing import Dict, Any, List

ACTION_CATALOG: Dict[str, Dict[str, Any]] = {
    "git_exposure_check": {
        "id": "git_exposure_check",
        "title": "Exposed Git Repository Probe",
        "risk_level": "L1",
        "description": "Send read-only HTTP GET request for /.git/config and inspect repository markers.",
        "side_effects": "none",
        "reversible": True,
        "default_timeout_s": 20,
        "param_schema": {
            "type": "object",
            "required": ["url"],
            "properties": {
                "url": {"type": "string"}
            }
        }
    },
    "ssrf_canary_probe": {
        "id": "ssrf_canary_probe",
        "title": "SSRF Pivot Reachability Probe",
        "risk_level": "L1",
        "description": "Probe internal host reachability through target SSRF endpoint with non-destructive HTTP GET.",
        "side_effects": "none",
        "reversible": True,
        "default_timeout_s": 20,
        "param_schema": {
            "type": "object",
            "required": ["url", "target_url"],
            "properties": {
                "url": {"type": "string"},
                "target_url": {"type": "string"}
            }
        }
    },
    "redis_unauth_ping": {
        "id": "redis_unauth_ping",
        "title": "Redis Unauthenticated PING Probe",
        "risk_level": "L1",
        "description": "Send standard Redis PING command over TCP to determine whether authentication is required.",
        "side_effects": "none",
        "reversible": True,
        "default_timeout_s": 15,
        "param_schema": {
            "type": "object",
            "required": ["host", "port"],
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"}
            }
        }
    },
    "redis_info_readonly": {
        "id": "redis_info_readonly",
        "title": "Redis Read-Only Server INFO Probe",
        "risk_level": "L1",
        "description": "Retrieve read-only server version and role metadata via Redis INFO command.",
        "side_effects": "none",
        "reversible": True,
        "default_timeout_s": 15,
        "param_schema": {
            "type": "object",
            "required": ["host", "port"],
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"}
            }
        }
    },
    "tcp_connect_check": {
        "id": "tcp_connect_check",
        "title": "TCP Port Connect Verification",
        "risk_level": "L1",
        "description": "Perform TCP handshake verification without payload transmission.",
        "side_effects": "none",
        "reversible": True,
        "default_timeout_s": 10,
        "param_schema": {
            "type": "object",
            "required": ["host", "port"],
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"}
            }
        }
    },
    "http_get_probe": {
        "id": "http_get_probe",
        "title": "HTTP GET Endpoint Check",
        "risk_level": "L1",
        "description": "Perform read-only HTTP GET probe to verify endpoint existence and headers.",
        "side_effects": "none",
        "reversible": True,
        "default_timeout_s": 15,
        "param_schema": {
            "type": "object",
            "required": ["url"],
            "properties": {
                "url": {"type": "string"}
            }
        }
    },
    "lab_write_canary": {
        "id": "lab_write_canary",
        "title": "Lab Canary Write & Immediate Delete",
        "risk_level": "L2",
        "description": "Write a harmless temporary nonce key to verify write permissions, followed by immediate deletion.",
        "side_effects": "reversible",
        "reversible": True,
        "default_timeout_s": 15,
        "param_schema": {
            "type": "object",
            "required": ["host", "port"],
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"}
            }
        }
    }
}

