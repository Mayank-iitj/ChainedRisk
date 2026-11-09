from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    org_name: str
    title: Optional[str] = "Lead SecOps Engineer"
    role: Optional[str] = "analyst"
    discord_id: Optional[str] = None

class OnboardingAssetInput(BaseModel):
    name: str
    ip: str
    type: str = "Host"
    zone: str = "dmz"
    services: List[str] = Field(default_factory=list)
    datastores: List[str] = Field(default_factory=list)

class OnboardingRequest(BaseModel):
    org_name: str
    operator_name: Optional[str] = None
    operator_title: Optional[str] = None
    industry: str
    environment: str
    risk_tolerance: str = "standard" # zero_tolerance, standard, high_gain_only
    project_name: str
    project_description: Optional[str] = ""
    scope_cidrs: List[str] = Field(default_factory=lambda: ["10.77.0.0/24"])
    ingress_assets: List[OnboardingAssetInput] = Field(default_factory=list)
    crown_jewels: List[OnboardingAssetInput] = Field(default_factory=list)
    active_scanners: List[str] = Field(default_factory=lambda: ["nmap", "gitleaks", "nuclei", "httpx"])
    attack_vectors_in_scope: List[str] = Field(default_factory=lambda: ["git", "ssrf", "creds", "cors", "env"])
    hitl_gate_policy: Optional[str] = "strict_l1_l2"
    notification_channel: Optional[str] = "discord"
    notification_webhook: Optional[str] = ""
    seed_baseline_scenario: bool = True

class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    code: Optional[str] = None
    dev_email: Optional[str] = None
    dev_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    org_name: Optional[str] = None
    title: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    discord_id: Optional[str] = None
    onboarding_completed: bool = False
    onboarding_profile: Optional[Dict[str, Any]] = None
    active_project_id: Optional[str] = None

# Scope & Project
class ScopeModel(BaseModel):
    cidrs: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    lab_only: bool = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    scope: ScopeModel = Field(default_factory=ScopeModel)

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    scope: Dict[str, Any]
    created_by: str
    created_at: str

# Finding
class FindingCreate(BaseModel):
    title: str
    stage: str # recon, config, vuln
    severity: str # info, low, medium, high, critical
    cvss: Optional[float] = 0.0
    asset_id: str
    rule_id: Optional[str] = "manual"
    source_tool: Optional[str] = "manual"
    evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    provides: Optional[List[str]] = Field(default_factory=list)
    requires: Optional[List[str]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)
    cwe: Optional[List[str]] = Field(default_factory=list)
    attack: Optional[List[str]] = Field(default_factory=list)

class FindingResponse(BaseModel):
    id: str
    project_id: str
    asset_id: str
    title: str
    stage: str
    severity: str
    cvss: float
    source_tool: str
    rule_id: str
    evidence: Dict[str, Any]
    provides: List[str]
    requires: List[str]
    cwe: List[str]
    attack: List[str]
    confidence: float
    first_seen: str

# Correlation
class CorrelateRequest(BaseModel):
    mode: Optional[str] = "hybrid" # rule, llm, hybrid
    max_chain_length: Optional[int] = 6
    top_n: Optional[int] = 20
    use_llm: Optional[bool] = True
    crown_jewels: Optional[List[str]] = Field(default_factory=list)

class ChainStepModel(BaseModel):
    id: Optional[str] = None
    order: int
    finding_ids: List[str]
    requires: List[str]
    provides: List[str]
    narrative: Optional[str] = ""
    evidence_refs: Optional[List[str]] = Field(default_factory=list)

class ChainResponse(BaseModel):
    id: str
    project_id: str
    title: str
    score: int
    severity: str
    likelihood: float
    impact: float
    chain_gain: int
    origin: str
    confidence: float
    status: str
    steps: List[ChainStepModel]
    explanation: Optional[str] = ""
    remediation: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    validation: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: str

# Approvals & HITL
class TargetModel(BaseModel):
    asset_id: str
    container: str
    ip: str

class BlastRadiusModel(BaseModel):
    score: int
    reachable_assets: List[str]
    datastores: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    credentials_in_scope: Optional[int] = 0
    state_change: str # none, reversible, irreversible
    network_scope: str # lab-only

class ApprovalCardResponse(BaseModel):
    id: str
    step_id: str
    chain_id: Optional[str] = None
    status: str
    title: Optional[str] = None
    command: str
    command_hash: str
    target: TargetModel
    risk_level: str
    blast_radius: BlastRadiusModel
    reason: str
    rollback: Optional[str] = "none required"
    timeout_s: Optional[int] = 20
    created_at: str
    expires_at: str
    discord_message_id: Optional[str] = None

class ApproveRequest(BaseModel):
    justification: Optional[str] = ""
    narrow: Optional[Dict[str, Any]] = None

class DenyRequest(BaseModel):
    reason: Optional[str] = "Denied by reviewer"

class ExecutionResponse(BaseModel):
    id: str
    step_id: str
    status: str
    verdict: str
    exit_code: Optional[int] = None
    started_at: str
    ended_at: Optional[str] = None
    logs: Optional[str] = ""

class AuditEventResponse(BaseModel):
    id: int
    ts: str
    actor: str
    type: str
    payload: Dict[str, Any]
    prev_hash: str
    hash: str

