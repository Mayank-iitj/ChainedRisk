import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.db.session import engine, Base, SessionLocal
from backend.app.models.db_models import User, Project, Finding, Asset, Chain
from backend.app.core.security import hash_password
from backend.app.ingest.normalizer import process_ingest
from backend.app.chain.engine import chain_engine
from backend.app.api.v1 import (
    auth, projects, ingest, graph, chains,
    approvals, executions, policy, audit, reports, ws, integrations
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager
from sqlalchemy import text

def migrate_sqlite_columns():
    """Safely add new columns to SQLite tables if they exist from older schema versions."""
    from backend.app.core.config import settings
    if "sqlite" not in settings.db_url:
        return
    try:
        with engine.connect() as conn:
            existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)"))]
            if existing_cols:
                needed = [
                    ("email", "VARCHAR"),
                    ("full_name", "VARCHAR"),
                    ("org_name", "VARCHAR"),
                    ("title", "VARCHAR"),
                    ("google_id", "VARCHAR"),
                    ("avatar_url", "VARCHAR"),
                    ("onboarding_completed", "BOOLEAN DEFAULT 0"),
                    ("onboarding_profile_json", "TEXT DEFAULT '{}'"),
                    ("active_project_id", "VARCHAR"),
                    ("created_at", "VARCHAR")
                ]
                for col_name, col_type in needed:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
    except Exception as e:
        print(f"[STARTUP] Column migration notice: {e}")

# Run column migrations on import
migrate_sqlite_columns()

def startup_populate_defaults():
    migrate_sqlite_columns()

    db = SessionLocal()
    try:
        # Purge any legacy demo logins and demo project data
        db.query(User).filter(
            (User.id.in_(["usr_admin", "usr_analyst", "usr_approver"])) |
            (User.username.in_(["admin", "analyst", "approver", "viewer"]))
        ).delete(synchronize_session=False)

        demo_p = db.query(Project).filter(Project.id == "prj_demo").first()
        if demo_p:
            db.query(Finding).filter(Finding.project_id == "prj_demo").delete(synchronize_session=False)
            db.query(Asset).filter(Asset.project_id == "prj_demo").delete(synchronize_session=False)
            db.query(Chain).filter(Chain.project_id == "prj_demo").delete(synchronize_session=False)
            db.delete(demo_p)

        db.commit()
    except Exception as e:
        print(f"[STARTUP] Notice during initialization: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_populate_defaults()
    yield

app = FastAPI(
    title="ChainedRisk API",
    description="Multi-Stage Attack Path Correlator with HITL Blast-Radius Gates",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware — supports Vercel deployments, custom domains, and local dev
_frontend_url = os.environ.get("FRONTEND_URL", "").strip().rstrip("/")
_cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
if _frontend_url:
    _cors_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response

# Mount API routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(ingest.router, prefix="/api/v1")
app.include_router(graph.router, prefix="/api/v1")
app.include_router(chains.router, prefix="/api/v1")
app.include_router(approvals.router, prefix="/api/v1")
app.include_router(executions.router, prefix="/api/v1")
app.include_router(policy.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(integrations.router, prefix="/api/v1")
app.include_router(ws.router)

@app.get("/")
def root():
    return {
        "service": "ChainedRisk API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "scope": "lab-only",
        "status": "operational"
    }
