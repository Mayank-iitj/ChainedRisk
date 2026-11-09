import base64
import json
import hmac
import hashlib
import time
import secrets
from typing import Dict, Any, Tuple, Optional
from backend.app.core.config import settings

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def b64url_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4)) if len(data_str) % 4 else ''
    return base64.urlsafe_b64decode(data_str + padding)

def create_approval_token(
    card_id: str,
    step_id: str,
    command_hash: str,
    target: Dict[str, Any],
    approver: str,
    ttl_seconds: int = 600
) -> Tuple[str, str]:
    """
    Creates HMAC-SHA256 signed approval token.
    Returns (token_string, nonce).
    """
    nonce = secrets.token_hex(16)
    exp = int(time.time()) + ttl_seconds
    payload = {
        "card_id": card_id,
        "step_id": step_id,
        "command_hash": command_hash,
        "target": target,
        "approver": approver,
        "exp": exp,
        "nonce": nonce
    }
    payload_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    payload_b64 = b64url_encode(payload_json.encode('utf-8'))

    signature = hmac.new(
        settings.CR_APPROVAL_HMAC_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    sig_b64 = b64url_encode(signature)

    token = f"{payload_b64}.{sig_b64}"
    return token, nonce

def verify_approval_token(
    token: str,
    expected_command_hash: str,
    consumed_nonces: set
) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Verifies signature, expiry, command hash equality, and nonce freshness.
    Returns (is_valid, payload, error_reason).
    """
    if not token or "." not in token:
        return False, None, "Malformed approval token"

    payload_b64, sig_b64 = token.split(".", 1)

    # Verify signature
    expected_sig = hmac.new(
        settings.CR_APPROVAL_HMAC_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()

    try:
        actual_sig = b64url_decode(sig_b64)
    except Exception:
        return False, None, "Invalid base64 signature in token"

    if not hmac.compare_digest(expected_sig, actual_sig):
        return False, None, "Invalid token signature"

    # Decode payload
    try:
        payload_bytes = b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
    except Exception:
        return False, None, "Invalid JSON in token payload"

    # Expiration check (Invariant INV-4)
    now = int(time.time())
    if payload.get("exp", 0) < now:
        return False, payload, "Approval token expired"

    # Nonce reuse check (Invariant INV-3)
    nonce = payload.get("nonce")
    if not nonce or nonce in consumed_nonces:
        return False, payload, "Token nonce already consumed"

    # Command hash match check (Invariant INV-2)
    if payload.get("command_hash") != expected_command_hash:
        return False, payload, f"Command hash mismatch (token: {payload.get('command_hash')}, expected: {expected_command_hash})"

    return True, payload, "OK"

