import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def canonical_json(data: Any) -> str:
    """Canonical compact JSON with sorted keys for reproducible hashing."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'))

def compute_event_hash(prev_hash: str, ts: str, actor: str, event_type: str, payload_json: str) -> str:
    content = f"{prev_hash}|{ts}|{actor}|{event_type}|{payload_json}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def verify_audit_chain(events: List[Any]) -> Tuple[bool, int, Optional[str], Optional[str]]:
    """
    Verifies that each event's prev_hash matches the previous event's hash,
    and each event's hash matches recomputed hash.
    Returns (is_valid, count, head_hash, error_message).
    """
    if not events:
        return True, 0, GENESIS_HASH, None

    prev_hash = GENESIS_HASH
    for idx, ev in enumerate(events):
        ev_id = getattr(ev, 'id', idx)
        ts = getattr(ev, 'ts')
        actor = getattr(ev, 'actor')
        event_type = getattr(ev, 'type')
        payload_json = getattr(ev, 'payload_json')
        stored_prev_hash = getattr(ev, 'prev_hash')
        stored_hash = getattr(ev, 'hash')

        if stored_prev_hash != prev_hash:
            return False, idx, stored_hash, f"Broken link at event {ev_id}: prev_hash mismatch"

        expected_hash = compute_event_hash(prev_hash, ts, actor, event_type, payload_json)
        if stored_hash != expected_hash:
            return False, idx, stored_hash, f"Tampered event at {ev_id}: hash mismatch"

        prev_hash = stored_hash

    return True, len(events), prev_hash, None

