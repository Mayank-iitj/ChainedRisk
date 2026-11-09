from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def utcnow_str():
    return datetime.now(timezone.utc).isoformat()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    pw_hash = Column(String, nullable=False)
    role = Column(String, default="analyst") # viewer, analyst, approver, admin
    discord_id = Column(String, nullable=True)

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    scope_json = Column(Text, default="{}")
    created_by = Column(String, default="system")
    created_at = Column(String, default=utcnow_str)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    type = Column(String, nullable=False) # Host, Service, Endpoint, DataStore, etc.
    name = Column(String, nullable=False)
    props_json = Column(Text, default="{}")
    zone = Column(String, default="internal") # external, dmz, internal, lab

    __table_args__ = (
        Index("idx_assets_proj_type", "project_id", "type"),
    )

class Finding(Base):
    __tablename__ = "findings"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    title = Column(String, nullable=False)
    stage = Column(String, nullable=False) # recon, config, vuln
    severity = Column(String, nullable=False) # info, low, medium, high, critical
    cvss = Column(Float, default=0.0)
    source_tool = Column(String, default="manual")
    rule_id = Column(String, default="")
    evidence_json = Column(Text, default="{}")
    provides_json = Column(Text, default="[]")
    requires_json = Column(Text, default="[]")
    cwe_json = Column(Text, default="[]")
    attack_json = Column(Text, default="[]")
    dedup_key = Column(String, unique=True, index=True)
    confidence = Column(Float, default=1.0)
    first_seen = Column(String, default=utcnow_str)

    __table_args__ = (
        Index("idx_findings_proj_sev", "project_id", "severity"),
    )

class Edge(Base):
    __tablename__ = "edges"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    src = Column(String, nullable=False, index=True)
    dst = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False) # CAN_REACH, HAS_FINDING, RUNS, EXPOSES, etc.
    props_json = Column(Text, default="{}")
    derived = Column(Integer, default=0)

class Chain(Base):
    __tablename__ = "chains"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    score = Column(Integer, default=0)
    severity = Column(String, default="low")
    likelihood = Column(Float, default=0.0)
    impact = Column(Float, default=0.0)
    chain_gain = Column(Integer, default=0)
    origin = Column(String, default="rule") # rule, llm, rule+llm
    confidence = Column(Float, default=1.0)
    status = Column(String, default="hypothesis") # hypothesis, planned, verifying, confirmed, not_reproduced, blocked, dismissed
    explanation = Column(Text, default="")
    validation_json = Column(Text, default="{}")
    remediation_json = Column(Text, default="[]")
    created_at = Column(String, default=utcnow_str)

class ChainStep(Base):
    __tablename__ = "chain_steps"
    id = Column(String, primary_key=True)
    chain_id = Column(String, ForeignKey("chains.id"), nullable=False)
    ord = Column(Integer, default=1)
    finding_ids_json = Column(Text, default="[]")
    requires_json = Column(Text, default="[]")
    provides_json = Column(Text, default="[]")
    narrative = Column(Text, default="")
    evidence_refs_json = Column(Text, default="[]")

class RejectedHypothesis(Base):
    __tablename__ = "rejected_hypotheses"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    payload_json = Column(Text, default="{}")
    reason = Column(String, nullable=False)
    created_at = Column(String, default=utcnow_str)

class VerificationPlan(Base):
    __tablename__ = "verification_plans"
    id = Column(String, primary_key=True)
    chain_id = Column(String, ForeignKey("chains.id"), nullable=False)
    created_at = Column(String, default=utcnow_str)

class VerificationStep(Base):
    __tablename__ = "verification_steps"
    id = Column(String, primary_key=True)
    plan_id = Column(String, ForeignKey("verification_plans.id"), nullable=False)
    ord = Column(Integer, default=1)
    action = Column(String, nullable=False)
    params_json = Column(Text, default="{}")
    target_asset = Column(String, nullable=False)
    risk_level = Column(String, default="L1") # L0, L1, L2, L3
    reversible = Column(Integer, default=1)
    command_preview = Column(String, nullable=False)
    command_hash = Column(String, nullable=False)
    blast_json = Column(Text, default="{}")
    status = Column(String, default="pending")

class ApprovalCard(Base):
    __tablename__ = "approval_cards"
    id = Column(String, primary_key=True)
    step_id = Column(String, ForeignKey("verification_steps.id"), nullable=False)
    status = Column(String, default="pending") # pending, approved, denied, expired, cancelled, consumed
    card_json = Column(Text, default="{}")
    created_at = Column(String, default=utcnow_str)
    expires_at = Column(String, nullable=False)
    discord_message_id = Column(String, nullable=True)

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(String, primary_key=True)
    card_id = Column(String, ForeignKey("approval_cards.id"), nullable=False)
    decision = Column(String, nullable=False) # approved, denied
    approver = Column(String, nullable=False)
    justification = Column(Text, default="")
    nonce = Column(String, unique=True, nullable=False)
    consumed = Column(Integer, default=0)
    decided_at = Column(String, default=utcnow_str)

class Execution(Base):
    __tablename__ = "executions"
    id = Column(String, primary_key=True)
    step_id = Column(String, ForeignKey("verification_steps.id"), nullable=False)
    approval_id = Column(String, nullable=True)
    container_id = Column(String, nullable=True)
    status = Column(String, default="running") # running, completed, failed, cancelled
    verdict = Column(String, default="pending") # confirmed, not_reproduced, blocked_by_policy, error, timeout
    exit_code = Column(Integer, nullable=True)
    started_at = Column(String, default=utcnow_str)
    ended_at = Column(String, nullable=True)
    logs = Column(Text, default="")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ts = Column(String, default=utcnow_str)
    actor = Column(String, nullable=False)
    type = Column(String, nullable=False)
    payload_json = Column(Text, default="{}")
    prev_hash = Column(String, nullable=False)
    hash = Column(String, nullable=False)

