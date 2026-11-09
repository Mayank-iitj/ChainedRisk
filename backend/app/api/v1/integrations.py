import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.approvals.service import approval_service
from backend.app.policy.engine import policy_engine
from backend.app.models.db_models import ApprovalCard

router = APIRouter(prefix="/integrations/discord", tags=["discord"])

def verify_discord_signature(signature: str, timestamp: str, body: bytes, public_key_hex: str) -> bool:
    if not public_key_hex:
        return True # dev mode fallback
    try:
        from nacl.signing import VerifyKey
        verify_key = VerifyKey(bytes.fromhex(public_key_hex))
        verify_key.verify(f"{timestamp}".encode() + body, bytes.fromhex(signature))
        return True
    except Exception:
        return False

@router.post("/interactions")
async def discord_interactions(
    request: Request,
    x_signature_ed25519: Optional[str] = Header(None),
    x_signature_timestamp: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    body = await request.body()

    if settings.DISCORD_PUBLIC_KEY:
        if not x_signature_ed25519 or not x_signature_timestamp:
            raise HTTPException(status_code=401, detail="Missing signature headers")
        if not verify_discord_signature(x_signature_ed25519, x_signature_timestamp, body, settings.DISCORD_PUBLIC_KEY):
            raise HTTPException(status_code=401, detail="Invalid request signature")

    data = json.loads(body.decode("utf-8"))
    interaction_type = data.get("type", 1)

    # Type 1: PING (Discord endpoint validation)
    if interaction_type == 1:
        return {"type": 1}

    # Type 3: MESSAGE_COMPONENT (Button clicks)
    if interaction_type == 3:
        custom_id = data.get("data", {}).get("custom_id", "")
        user_info = data.get("member", {}).get("user", {}) or data.get("user", {})
        discord_user_id = user_info.get("id", "")
        username = user_info.get("username", "discord_approver")

        # Check approver allowlist if configured
        if settings.CR_APPROVER_DISCORD_IDS:
            allowed_ids = [i.strip() for i in settings.CR_APPROVER_DISCORD_IDS.split(",") if i.strip()]
            if discord_user_id not in allowed_ids:
                return {
                    "type": 4,
                    "data": {
                        "content": f"❌ Unauthorized: Discord user ID {discord_user_id} is not in approver allowlist.",
                        "flags": 64 # ephemeral
                    }
                }

        if custom_id.startswith("approve:"):
            card_id = custom_id.split(":", 1)[1]
            try:
                res = approval_service.approve_card(
                    card_id=card_id,
                    approver=f"discord:{username}",
                    justification="Approved via Discord HITL button",
                    db=db
                )
                return {
                    "type": 7, # Update message
                    "data": {
                        "content": f"✅ **APPROVED & TOKEN ISSUED** by @{username}\nNonce: `{res.get('nonce')}`\n*Runner dispatched to isolated lab.*",
                        "components": [] # disable buttons
                    }
                }
            except Exception as e:
                return {
                    "type": 4,
                    "data": {"content": f"⚠️ Approval failed: {str(e)}", "flags": 64}
                }

        elif custom_id.startswith("deny:"):
            card_id = custom_id.split(":", 1)[1]
            try:
                approval_service.deny_card(
                    card_id=card_id,
                    approver=f"discord:{username}",
                    reason="Denied via Discord interaction",
                    db=db
                )
                return {
                    "type": 7,
                    "data": {
                        "content": f"🛑 **DENIED** by @{username}\n*Execution blocked by human reviewer.*",
                        "components": []
                    }
                }
            except Exception as e:
                return {
                    "type": 4,
                    "data": {"content": f"⚠️ Deny failed: {str(e)}", "flags": 64}
                }

    # Type 2: APPLICATION_COMMAND (/chained)
    if interaction_type == 2:
        cmd_name = data.get("data", {}).get("name", "")
        options = data.get("data", {}).get("options", [])
        subcmd = options[0].get("name", "") if options else ""

        if subcmd == "pending":
            pending_cards = db.query(ApprovalCard).filter(ApprovalCard.status == "pending").all()
            if not pending_cards:
                return {"type": 4, "data": {"content": "✅ No pending approval cards in queue."}}
            lines = [f"**{len(pending_cards)} Pending Approval Cards:**"]
            for c in pending_cards:
                c_data = json.loads(c.card_json)
                lines.append(f"• `{c.id}`: {c_data.get('title')} ({c_data.get('risk_level')})")
            return {"type": 4, "data": {"content": "\n".join(lines)}}

        elif subcmd == "kill":
            policy_engine.activate_kill_switch("Emergency kill triggered via Discord slash command")
            return {
                "type": 4,
                "data": {"content": "🚨 **EMERGENCY KILL SWITCH ACTIVATED** via Discord.\nAll runners halted; pending cards cancelled."}
            }

        elif subcmd == "status":
            return {
                "type": 4,
                "data": {
                    "content": f"🛡️ **ChainedRisk Platform Status:**\n• Scope: `lab-only` (10.77.0.0/24)\n• Kill Lock: `{policy_engine.kill_locked}`\n• Engine: Active"
                }
            }

    return {"type": 4, "data": {"content": "ChainedRisk Bot acknowledging command."}}

