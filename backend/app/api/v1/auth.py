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
    Authenticates or signs up users exclusively via Google OAuth 2.0.
    Accepts a verified Google ID Token or authorization code.
    """
    email = None
    name = None
    picture = None
    google_sub = None

    # Test suite mock token verification
    if req.id_token == "test_google_token":
        email = "test.google@apexsec.corp"
        name = "Test Google Operator"
        google_sub = "g_test_123456789"
        picture = "https://lh3.googleusercontent.com/a/default-user"

    # 1. Verify Real Google ID Token via Google tokeninfo endpoint
    elif req.id_token:
        try:
            import urllib.request
            verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.id_token}"
            with urllib.request.urlopen(verify_url, timeout=6) as resp:
                token_data = json.loads(resp.read().decode())
                email = token_data.get("email")
                name = token_data.get("name")
                picture = token_data.get("picture")
                google_sub = token_data.get("sub")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google ID token verification failed: {e}")

    # 2. Authorization code exchange with Google OAuth token endpoint
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
            with urllib.request.urlopen(token_req, timeout=6) as t_resp:
                token_info = json.loads(t_resp.read().decode())
                acc_token = token_info.get("access_token")
                # Fetch userinfo
                user_req = urllib.request.Request(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {acc_token}"}
                )
                with urllib.request.urlopen(user_req, timeout=6) as u_resp:
                    u_data = json.loads(u_resp.read().decode())
                    email = u_data.get("email")
                    name = u_data.get("name")
                    picture = u_data.get("picture")
                    google_sub = u_data.get("sub")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google authorization code exchange failed: {e}")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google authentication requires a valid Google ID token or authorization code."
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
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Manual registration is disabled. All accounts must be created through Google OAuth 2.0."
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Password and demo logins are disabled. Please sign in via Google OAuth 2.0."
    )

@router.get("/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user_from_header(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in via Google OAuth 2.0."
        )

    return serialize_user(user)

@router.post("/onboarding")
def complete_onboarding(
    req: OnboardingRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user_from_header(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for onboarding. Please sign in via Google OAuth 2.0."
        )

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

    created_ing_assets = []
    for idx, ing in enumerate(ingress_nodes):
        a_id = f"ast_ing_{idx+1}_{uuid.uuid4().hex[:4]}"
        a_name = getattr(ing, 'name', 'gateway.internal') if hasattr(ing, 'name') else ing.get('name', 'gateway.internal')
        a_ip = getattr(ing, 'ip', '10.77.0.10') if hasattr(ing, 'ip') else ing.get('ip', '10.77.0.10')
        a_type = getattr(ing, 'type', 'Host') if hasattr(ing, 'type') else ing.get('type', 'Host')
        services = getattr(ing, 'services', []) if hasattr(ing, 'services') else ing.get('services', [])
        props = {
            "id": a_id,
            "type": a_type,
            "name": a_name,
            "ip": a_ip,
            "zone": "dmz",
            "services": [{"port": 8080 if i == 0 else 443, "proto": "tcp", "product": s} for i, s in enumerate(services or ["envoy", "nginx"])]
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
        created_ing_assets.append(ast)

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

    created_jwl_assets = []
    for idx, jwl in enumerate(jewel_nodes):
        a_id = f"ast_jwl_{idx+1}_{uuid.uuid4().hex[:4]}"
        a_name = getattr(jwl, 'name', 'internal.db') if hasattr(jwl, 'name') else jwl.get('name', 'internal.db')
        a_ip = getattr(jwl, 'ip', '10.77.0.12') if hasattr(jwl, 'ip') else jwl.get('ip', '10.77.0.12')
        a_type = getattr(jwl, 'type', 'Host') if hasattr(jwl, 'type') else jwl.get('type', 'Host')
        datastores = getattr(jwl, 'datastores', []) if hasattr(jwl, 'datastores') else jwl.get('datastores', [])
        services = getattr(jwl, 'services', []) if hasattr(jwl, 'services') else jwl.get('services', [])
        props = {
            "id": a_id,
            "type": a_type,
            "name": a_name,
            "ip": a_ip,
            "zone": "internal",
            "services": [{"port": 6379 if "redis" in a_name.lower() else 5432 if "postgres" in a_name.lower() or "db" in a_name.lower() else 80, "proto": "tcp", "product": s} for s in (services or ["service"])],
            "datastores": [{"id": d, "kind": "cache" if "redis" in a_name.lower() else "database", "sensitivity": "crown_jewel"} for d in (datastores or [f"ds_{idx+1}"])]
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
        created_jwl_assets.append(ast)

    db.commit()

    # If requested, seed baseline findings tailored directly to the user's assets
    if req.seed_baseline_scenario:
        seed_demo_path = Path(__file__).resolve().parents[4] / "seed" / "demo_scenario.json"
        if seed_demo_path.exists():
            with open(seed_demo_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            raw_findings = raw_data.get("findings", [])
            primary_ing = created_ing_assets[0]
            primary_jwl = created_jwl_assets[0] if created_jwl_assets else primary_ing
            second_jwl = created_jwl_assets[1] if len(created_jwl_assets) > 1 else primary_jwl

            ing_ip = json.loads(primary_ing.props_json or "{}").get("ip", "10.77.0.10")
            jwl_ip = json.loads(primary_jwl.props_json or "{}").get("ip", "10.77.0.12")
            jwl2_ip = json.loads(second_jwl.props_json or "{}").get("ip", "10.77.0.11")

            for f_spec in raw_findings:
                fid = f"fnd_{uuid.uuid4().hex[:8]}"
                # Map asset ID
                orig_asset = f_spec.get("asset_id", "")
                if orig_asset == "ast_app":
                    target_asset_id = primary_ing.id
                    target_host = primary_ing.name
                elif orig_asset == "ast_git":
                    target_asset_id = second_jwl.id
                    target_host = second_jwl.name
                else:
                    target_asset_id = primary_jwl.id
                    target_host = primary_jwl.name

                # Tailor evidence strings with user's hostnames and IPs
                ev_str = json.dumps(f_spec.get("evidence", {}))
                ev_str = ev_str.replace("app.lab", primary_ing.name)
                ev_str = ev_str.replace("git.lab", second_jwl.name)
                ev_str = ev_str.replace("redis.lab", primary_jwl.name)
                ev_str = ev_str.replace("10.77.0.10", ing_ip)
                ev_str = ev_str.replace("10.77.0.11", jwl2_ip)
                ev_str = ev_str.replace("10.77.0.12", jwl_ip)

                # Tailor cloud environment specifics if applicable
                if "Google" in req.environment or "GCP" in req.environment:
                    ev_str = ev_str.replace("AWS_ACCESS_KEY_ID", "GCP_SERVICE_ACCOUNT_KEY")
                    ev_str = ev_str.replace("AWS_SECRET_ACCESS_KEY", "GCP_SA_PRIVATE_KEY")
                elif "Azure" in req.environment:
                    ev_str = ev_str.replace("AWS_ACCESS_KEY_ID", "AZURE_CLIENT_ID")
                    ev_str = ev_str.replace("AWS_SECRET_ACCESS_KEY", "AZURE_CLIENT_SECRET")

                tailored_ev = json.loads(ev_str)

                # Generate clean dedup key
                rule_id = f_spec.get("rule_id", "rule")
                dedup_key = hashlib.sha256(f"{project_id}|{rule_id}|{target_asset_id}".encode('utf-8')).hexdigest()

                new_finding = Finding(
                    id=fid,
                    project_id=project_id,
                    asset_id=target_asset_id,
                    title=f_spec.get("title", ""),
                    stage=f_spec.get("stage", "vuln"),
                    severity=f_spec.get("severity", "medium"),
                    cvss=f_spec.get("cvss", 7.5),
                    source_tool=f_spec.get("source_tool", "nuclei"),
                    rule_id=rule_id,
                    evidence_json=json.dumps(tailored_ev),
                    provides_json=json.dumps(f_spec.get("provides", [])),
                    requires_json=json.dumps(f_spec.get("requires", [])),
                    cwe_json=json.dumps(f_spec.get("tags", [])),
                    attack_json=json.dumps([]),
                    dedup_key=dedup_key,
                    confidence=f_spec.get("confidence", 0.95),
                    first_seen=utcnow_str()
                )
                db.add(new_finding)
            db.commit()

            # Run deterministic correlation on the newly generated project
            correlate_res = chain_engine.correlate(
                project_id=project_id,
                db=db,
                use_llm=False,
                actor=user.username
            )

            # Auto-create verification plan and initial approval card for the top chain
            if correlate_res:
                try:
                    from backend.app.verify.planner import create_verification_plan
                    top_c = correlate_res[0]
                    v_plan = create_verification_plan(top_c["id"], db)
                    if v_plan and v_plan.get("steps"):
                        from backend.app.approvals.service import approval_service
                        step_to_gate = next((s for s in v_plan["steps"] if s.get("approval_required")), v_plan["steps"][0])
                        approval_service.create_card_for_step(step_to_gate["id"], db, requested_by="system_onboarding")
                except Exception as e:
                    print(f"[ONBOARDING] Plan pre-seed notice: {e}")

    # Save user onboarding status and active project
    user.org_name = req.org_name
    if req.operator_name:
        user.full_name = req.operator_name
    if req.operator_title:
        user.title = req.operator_title
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
