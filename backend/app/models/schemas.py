from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    discord_id: Optional[str] = None

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

