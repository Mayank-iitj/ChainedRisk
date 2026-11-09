export interface Project {
  id: string;
  name: string;
  description: string;
  scope: {
    cidrs?: string[];
    domains?: string[];
    lab_only?: boolean;
  };
  created_at: string;
}

export interface TargetAssetSummary {
  id: string;
  name: string;
  tech: string;
  progress: number;
  color: string;
  status: string;
  findings_count: number;
  ip: string;
  zone: string;
}

export interface CrownJewelSummary {
  name: string;
  id: string;
  tag: string;
  ip: string;
  findings: number;
}

export interface ProjectStats {
  assets: number;
  findings: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  by_stage: {
    recon: number;
    config: number;
    vuln: number;
  };
  chains: number;
  pending_approvals: number;
  verified_chains: number;
  noise_reduction_percent: number;
  target_assets?: TargetAssetSummary[];
  crown_jewels?: CrownJewelSummary[];
}

export interface Finding {
  id: string;
  project_id: string;
  asset_id: string;
  title: string;
  stage: 'recon' | 'config' | 'vuln';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  cvss: number;
  source_tool: string;
  rule_id: string;
  evidence: Record<string, any>;
  provides: string[];
  requires: string[];
  cwe: string[];
  attack: string[];
  confidence: number;
  first_seen: string;
}

export interface ChainStep {
  id: string;
  order: number;
  finding_ids: string[];
  requires: string[];
  provides: string[];
  narrative: string;
  evidence_refs?: string[];
}

export interface AttackChain {
  id: string;
  project_id: string;
  title: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  impact: number;
  chain_gain: number;
  origin: string;
  confidence: number;
  status: 'hypothesis' | 'planned' | 'verifying' | 'confirmed' | 'not_reproduced' | 'blocked' | 'dismissed';
  steps: ChainStep[];
  explanation: string;
  remediation?: RemediationItem[];
  validation?: {
    passed: boolean;
    checks: string[];
    rejected_reason?: string;
  };
  created_at: string;
}

export interface RemediationItem {
  finding_id: string;
  title: string;
  action: string;
  effort: string;
  breaks_chains_count: number;
  breaks_chains: string[];
  risk_eliminated: number;
}

export interface ApprovalCard {
  id: string;
  step_id: string;
  chain_id?: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled' | 'consumed';
  title?: string;
  command: string;
  command_hash: string;
  target: {
    asset_id: string;
    container: string;
    ip: string;
  };
  risk_level: 'L0' | 'L1' | 'L2' | 'L3';
  blast_radius: {
    score: number;
    reachable_assets: string[];
    datastores?: Array<{ id: string; sensitivity: string }>;
    credentials_in_scope: number;
    state_change: 'none' | 'reversible' | 'irreversible';
    network_scope: 'lab-only';
  };
  reason: string;
  rollback: string;
  timeout_s: number;
  created_at: string;
  expires_at: string;
  requested_by?: string;
}

export interface AuditEvent {
  id: number;
  ts: string;
  actor: string;
  type: string;
  payload: Record<string, any>;
  prev_hash: string;
  hash: string;
}

