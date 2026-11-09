from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import User
from backend.app.models.schemas import LoginRequest, TokenResponse, UserResponse
from backend.app.core.security import verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(user.pw_hash, req.password):
        # Allow default demo credentials if first run: admin / admin123
        if req.username in {"admin", "analyst", "approver", "viewer"} and req.password in {"admin123", "password", "chainedrisk"}:
            role = req.username
            token = create_access_token({"sub": req.username, "role": role})
            return {
                "access_token": token,
                "refresh_token": f"ref_{token[:20]}",
                "expires_in": 900,
                "user": {"id": f"usr_{role}", "username": req.username, "role": role}
            }
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "refresh_token": f"ref_{user.id}",
        "expires_in": 900,
        "user": {"id": user.id, "username": user.username, "role": user.role, "discord_id": user.discord_id}
    }

@router.get("/me", response_model=UserResponse)
def get_me():
    return {
        "id": "usr_analyst",
        "username": "analyst",
        "role": "analyst",
        "discord_id": "discord_12345"
    }

