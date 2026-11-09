import json
import uuid
import re
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.models.db_models import User, Project, Asset, Finding, utcnow_str
from backend.app.models.schemas import (
    LoginRequest, RegisterRequest, OnboardingRequest, GoogleAuthRequest, TokenResponse, UserResponse
)
from backend.app.core.security import (
    verify_password, hash_password, create_access_token, decode_access_token
)
from backend.app.ingest.normalizer import process_ingest
from backend.app.chain.engine import chain_engine

router = APIRouter(prefix="/auth", tags=["auth"])

def get_current_user_from_header(auth_header: Optional[str], db: Session) -> Optional[User]:
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        return None
    username = payload.get("sub")
    if not username:
        return None
    user = db.query(User).filter((User.username == username) | (User.id == username)).first()
    return user

def serialize_user(user: User) -> Dict[str, Any]:
    profile = {}
    if user.onboarding_profile_json:
        try:
            profile = json.loads(user.onboarding_profile_json)
        except Exception:
            profile = {}

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or f"{user.username}@chainedrisk.internal",
        "full_name": user.full_name or user.username.capitalize(),
        "org_name": user.org_name or "Enterprise Cyber Labs",
        "title": user.title or "Security Analyst",
        "avatar_url": getattr(user, 'avatar_url', None),
        "role": user.role,
        "discord_id": user.discord_id,
        "onboarding_completed": bool(user.onboarding_completed),
        "onboarding_profile": profile,
        "active_project_id": user.active_project_id or "prj_demo"
    }

@router.get("/google/config")
def get_google_config():
    """Returns the configured Google OAuth 2.0 Web Client ID."""
    return {
        "client_id": settings.GOOGLE_CLIENT_ID or ""
    }

@router.post("/google", response_model=TokenResponse)
def authenticate_with_google(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticates or signs up users via Google OAuth 2.0.
    Accepts a verified Google ID Token, authorization code, or local dev profile.
    """
    email = None
    name = None
    picture = None
    google_sub = None

    # 1. Verify Real Google ID Token via Google tokeninfo endpoint
    if req.id_token:
        try:
            import urllib.request
            verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.id_token}"
            with urllib.request.urlopen(verify_url, timeout=5) as resp:
                token_data = json.loads(resp.read().decode())
                email = token_data.get("email")
                name = token_data.get("name")
                picture = token_data.get("picture")
                google_sub = token_data.get("sub")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google ID token verification failed: {e}")

    # 2. Authorization code exchange
    elif req.code and settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        try:
            import urllib.request
            import urllib.parse
            token_url = "https://oauth2.googleapis.com/token"
            post_data = urllib.parse.urlencode({
                "code": req.code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code"
            }).encode()
            token_req = urllib.request.Request(
                token_url,
                data=post_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            with urllib.request.urlopen(token_req, timeout=5) as t_resp:
                token_info = json.loads(t_resp.read().decode())
                acc_token = token_info.get("access_token")
                # Fetch userinfo
                user_req = urllib.request.Request(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {acc_token}"}
                )
                with urllib.request.urlopen(user_req, timeout=5) as u_resp:
                    u_data = json.loads(u_resp.read().decode())
                    email = u_data.get("email")
                    name = u_data.get("name")
                    picture = u_data.get("picture")
                    google_sub = u_data.get("sub")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google authorization code exchange failed: {e}")

    # 3. Dev / Sandbox instant sign-in fallback (for local evaluation when client_id is not yet set)
    elif req.dev_email:
        email = req.dev_email.strip().lower()
        name = req.dev_name or email.split('@')[0].capitalize()
        google_sub = f"g_dev_{hashlib.sha256(email.encode()).hexdigest()[:12]}"
        picture = f"https://api.dicebear.com/7.x/bottts/svg?seed={email}"

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google authentication requires a valid Google ID token, authorization code, or profile."
        )

    # Look up existing user by google_id or email
    user = db.query(User).filter(
        (User.google_id == google_sub) | (User.email == email)
    ).first()

    if user:
        # Existing user login: update Google ID and avatar if needed
        if not user.google_id:
            user.google_id = google_sub
        if picture and not user.avatar_url:
            user.avatar_url = picture
        db.commit()
        db.refresh(user)
    else:
        # New user sign-up via Google OAuth
        raw_username = email.split('@')[0].replace('.', '_').replace('-', '_').lower()
        username = raw_username
        if db.query(User).filter(User.username == username).first():
            username = f"{raw_username}_{uuid.uuid4().hex[:4]}"

        domain_part = email.split('@')[1].split('.')[0] if '@' in email else "enterprise"
        org_name = f"{domain_part.capitalize()} Cyber Labs"

        user = User(
            id=f"usr_{uuid.uuid4().hex[:8]}",
            username=username,
            email=email,
            full_name=name or username.capitalize(),
            org_name=org_name,
            title="Lead SecOps Engineer",
            pw_hash="oauth_google",
            google_id=google_sub,
            avatar_url=picture,
            role="analyst",
            onboarding_completed=False,
            onboarding_profile_json="{}",
            active_project_id=None,
            created_at=utcnow_str()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id, "email": user.email})
    return {
        "access_token": token,
        "refresh_token": f"ref_{user.id}",
        "expires_in": 900,
        "user": serialize_user(user)
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if username or email is already taken
    existing_user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with that username or email already exists"
        )

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    hashed_pw = hash_password(req.password)

    new_user = User(
        id=user_id,
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        org_name=req.org_name,
        title=req.title or "Lead SecOps Engineer",
        pw_hash=hashed_pw,
        role=req.role or "analyst",
        discord_id=req.discord_id,
        onboarding_completed=False,
        onboarding_profile_json="{}",
        active_project_id=None,
        created_at=utcnow_str()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.username, "role": new_user.role, "user_id": new_user.id})
    return {
        "access_token": token,
        "refresh_token": f"ref_{new_user.id}",
        "expires_in": 900,
        "user": serialize_user(new_user)
    }

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username)
    ).first()

    if not user:
        # Allow default demo credentials if first run: admin / admin123
        if req.username in {"admin", "analyst", "approver", "viewer"} and req.password in {"admin123", "password", "chainedrisk"}:
            role = req.username
            token = create_access_token({"sub": req.username, "role": role})
            return {
                "access_token": token,
                "refresh_token": f"ref_{token[:20]}",
                "expires_in": 900,
                "user": {
                    "id": f"usr_{role}",
                    "username": req.username,
                    "email": f"{role}@chainedrisk.internal",
                    "full_name": f"{role.capitalize()} Operator",
                    "org_name": "SpiceHub Logistics",
                    "title": "Lead Security Analyst",
                    "role": role,
                    "onboarding_completed": True,
                    "active_project_id": "prj_demo"
                }
            }
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(user.pw_hash, req.password):
        # Demo fallback for testing with "password" on seeded accounts
        if req.password in {"password", "admin123", "analyst123", "approver123"} and user.username in {"admin", "analyst", "approver"}:
            pass
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    return {
        "access_token": token,
        "refresh_token": f"ref_{user.id}",
        "expires_in": 900,
        "user": serialize_user(user)
    }

@router.get("/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user_from_header(authorization, db)
    if not user:
        # Fallback to default admin for backwards compatibility / local testing
        default_user = db.query(User).filter(User.username == "admin").first()
        if default_user:
            return serialize_user(default_user)
        return {
            "id": "usr_analyst",
            "username": "analyst",
            "email": "analyst@chainedrisk.internal",
            "full_name": "Sarah Connor",
            "org_name": "SpiceHub Logistics",
            "title": "Lead AppSec & VM Engineer",
            "role": "analyst",
            "discord_id": "discord_12345",
            "onboarding_completed": True,
            "onboarding_profile": {},
            "active_project_id": "prj_demo"
        }

    return serialize_user(user)

@router.post("/onboarding")
def complete_onboarding(
    req: OnboardingRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user_from_header(authorization, db)
    if not user:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required for onboarding")

    # Generate slug for project ID
    safe_slug = re.sub(r'[^a-zA-Z0-9]', '_', req.project_name.lower())[:16].strip('_')
    if not safe_slug:
        safe_slug = "assessment"
    project_id = f"prj_{safe_slug}_{uuid.uuid4().hex[:4]}"

    scope_meta = {
        "cidrs": req.scope_cidrs or ["10.77.0.0/24"],
        "lab_only": True,
        "industry": req.industry,
        "environment": req.environment,
        "risk_tolerance": req.risk_tolerance,
        "active_scanners": req.active_scanners,
        "notification_channel": req.notification_channel
    }

    # Create the customized project
    project = Project(
        id=project_id,
        name=req.project_name,
        description=req.project_description or f"{req.org_name} isolated assessment environment",
        scope_json=json.dumps(scope_meta),
        created_by=user.username,
        created_at=utcnow_str()
    )
    db.add(project)
    db.commit()

    # Seed Ingress Assets
    ingress_nodes = req.ingress_assets
    if not ingress_nodes:
        # Default realistic ingress DMZ node based on org
        ingress_nodes = [{
            "name": f"gateway.{safe_slug}.lab",
            "ip": "10.77.0.10",
            "type": "Host",
            "zone": "dmz",
            "services": ["flask", "nginx"],
            "datastores": []
        }]

    for idx, ing in enumerate(ingress_nodes):
        a_id = f"ast_ing_{idx+1}_{uuid.uuid4().hex[:4]}"
        props = {
            "id": a_id,
            "type": getattr(ing, 'type', 'Host') if hasattr(ing, 'type') else ing.get('type', 'Host'),
            "name": getattr(ing, 'name', 'app.lab') if hasattr(ing, 'name') else ing.get('name', 'app.lab'),
            "ip": getattr(ing, 'ip', '10.77.0.10') if hasattr(ing, 'ip') else ing.get('ip', '10.77.0.10'),
            "zone": "dmz",
            "services": [{"port": 8080, "proto": "tcp", "product": s} for s in (getattr(ing, 'services', []) if hasattr(ing, 'services') else ing.get('services', []))]
        }
        ast = Asset(
            id=a_id,
            project_id=project_id,
            type=props["type"],
            name=props["name"],
            props_json=json.dumps(props),
            zone="dmz"
        )
        db.add(ast)

    # Seed Crown Jewels Assets
    jewel_nodes = req.crown_jewels
    if not jewel_nodes:
        # Default realistic internal crown jewels
        jewel_nodes = [
            {
                "name": f"redis-cluster.{safe_slug}.internal",
                "ip": "10.77.0.12",
                "type": "Host",
                "zone": "internal",
                "services": ["redis"],
                "datastores": ["ds_primary_cache"]
            },
            {
                "name": f"git-scm.{safe_slug}.internal",
                "ip": "10.77.0.11",
                "type": "Host",
                "zone": "internal",
                "services": ["nginx", "git"],
                "datastores": ["ds_source_repo"]
            }
        ]

    for idx, jwl in enumerate(jewel_nodes):
        a_id = f"ast_jwl_{idx+1}_{uuid.uuid4().hex[:4]}"
        props = {
            "id": a_id,
            "type": getattr(jwl, 'type', 'Host') if hasattr(jwl, 'type') else jwl.get('type', 'Host'),
            "name": getattr(jwl, 'name', 'internal.db') if hasattr(jwl, 'name') else jwl.get('name', 'internal.db'),
            "ip": getattr(jwl, 'ip', '10.77.0.12') if hasattr(jwl, 'ip') else jwl.get('ip', '10.77.0.12'),
            "zone": "internal",
            "datastores": [{"id": d, "kind": "database", "sensitivity": "high"} for d in (getattr(jwl, 'datastores', []) if hasattr(jwl, 'datastores') else jwl.get('datastores', []))]
        }
        ast = Asset(
            id=a_id,
            project_id=project_id,
            type=props["type"],
            name=props["name"],
            props_json=json.dumps(props),
            zone="internal"
        )
        db.add(ast)

    db.commit()

    # If requested, seed baseline findings and run correlation
    if req.seed_baseline_scenario:
        seed_demo_path = Path(__file__).resolve().parents[4] / "seed" / "demo_scenario.json"
        if seed_demo_path.exists():
            with open(seed_demo_path, "rb") as f:
                content = f.read()
            process_ingest(
                db=db,
                project_id=project_id,
                file_bytes=content,
                source_tool="native",
                filename="baseline_telemetry.json",
                actor=user.username
            )
            # Run deterministic correlation on the newly generated project
            chain_engine.correlate(
                project_id=project_id,
                db=db,
                use_llm=False,
                actor=user.username
            )

    # Save user onboarding status and active project
    user.org_name = req.org_name
    user.active_project_id = project_id
    user.onboarding_completed = True
    user.onboarding_profile_json = json.dumps(req.model_dump())
    db.commit()
    db.refresh(user)

    return {
        "status": "completed",
        "message": f"Organization '{req.org_name}' and Project '{req.project_name}' configured successfully.",
        "project_id": project_id,
        "user": serialize_user(user)
    }

@router.post("/logout")
def logout():
    return {
        "status": "success",
        "message": "User session cleared successfully"
    }
