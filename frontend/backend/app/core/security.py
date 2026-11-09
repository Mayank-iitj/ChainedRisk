import re
import hmac
import hashlib
import time
import secrets
from typing import Optional, Dict, Any
import jwt
from backend.app.core.config import settings

SECRET_REDACT_PATTERNS = [
    (re.compile(r'(?i)(bearer\s+)[A-Za-z0-9_\-\.]{15,}'), r'\1[REDACTED_TOKEN]'),
    (re.compile(r'(?i)(password|passwd|pwd|secret|api[_-]?key)["\']?\s*[:=]\s*["\']?([^"\'\s&]+)'), r'\1="[REDACTED_SECRET]"'),
    (re.compile(r'(?i)-----BEGIN[A-Z\s]+PRIVATE KEY-----[\s\S]*?-----END[A-Z\s]+PRIVATE KEY-----'), '[REDACTED_PRIVATE_KEY]'),
    (re.compile(r'(?i)(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,})'), '[REDACTED_GITHUB_TOKEN]'),
    (re.compile(r'(?i)(aws_secret_access_key|aws_session_token)\s*=\s*[A-Za-z0-9/+=]{30,}'), r'\1=[REDACTED_AWS_SECRET]'),
]

def redact_text(text: str) -> str:
    """Redacts secrets, credentials and keys from evidence strings."""
    if not text:
        return text
    result = text
    for pattern, replacement in SECRET_REDACT_PATTERNS:
        result = pattern.sub(replacement, result)
    return result

def hash_password(password: str) -> str:
    """Hash password using salt + pbkdf2_hmac."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
    return f"{salt}${key.hex()}"

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        salt, key_hex = stored_hash.split("$")
        computed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
        return hmac.compare_digest(computed.hex(), key_hex)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta_seconds: int = 900) -> str:
    to_encode = data.copy()
    expire = time.time() + expires_delta_seconds
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.CR_SECRET_KEY, algorithm="HS256")

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.CR_SECRET_KEY, algorithms=["HS256"])
        return payload
    except Exception:
        return None

