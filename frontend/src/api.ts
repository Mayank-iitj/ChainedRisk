import {
  Project,
  ProjectStats,
  Finding,
  AttackChain,
  ApprovalCard,
  AuditEvent,
  RemediationItem,
  UserProfile,
  OnboardingProfileData,
  AssetItem,
  PolicyRule
} from './types';

export function getApiOrigin(): string {
  // 1. Explicit user override stored in localStorage
  const stored = localStorage.getItem('cr_backend_url');
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }

  // 2. Runtime injected config (from docker-entrypoint /runtime-config.js)
  const runtimeBackend = (window as any).__RUNTIME_CONFIG__?.BACKEND_URL;
  if (runtimeBackend && runtimeBackend.trim() && !runtimeBackend.includes('127.0.0.1') && !runtimeBackend.includes('localhost')) {
    return runtimeBackend.trim().replace(/\/+$/, '');
  }

  // 3. Vite build-time environment variable
  const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (rawApiUrl) {
    return rawApiUrl.startsWith('http') ? rawApiUrl.replace(/\/+$/, '') : `https://${rawApiUrl.replace(/\/+$/, '')}`;
  }

  // 4. Default to same origin (relative path)
  return '';
}

export function setApiOrigin(url: string | null) {
  if (url && url.trim()) {
    localStorage.setItem('cr_backend_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('cr_backend_url');
  }
}

export function getBaseUrl(): string {
  const origin = getApiOrigin();
  return origin ? `${origin}/api/v1` : '/api/v1';
}

export const API_ORIGIN = getApiOrigin();

export async function testBackendConnection(targetUrl?: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const origin = targetUrl !== undefined ? targetUrl.trim().replace(/\/+$/, '') : getApiOrigin();
    const endpoint = origin ? `${origin}/api/v1/config/public` : '/api/v1/config/public';
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      return { ok: true, status: res.status };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Connection failed' };
  }
}


export function getAuthToken(): string | null {
  return localStorage.getItem('cr_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('cr_auth_token', token);
  } else {
    localStorage.removeItem('cr_auth_token');
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status}: ${res.statusText})`;
    if (res.status === 502) {
      errMsg = '502 Bad Gateway: Backend API service unreachable. Please check backend connection or configure your Backend API URL.';
    }
    try {
      const errData = await res.json();
      if (errData && errData.detail) {
        errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // not JSON body
    }
    throw new Error(errMsg);
  }
  return res.json();
}

// ----------------- Authentication & Onboarding -----------------

export async function fetchGoogleConfig(): Promise<{ client_id: string }> {
  const res = await fetch(`${getBaseUrl()}/auth/google/config`);
  return handleResponse<{ client_id: string }>(res);
}

export async function authenticateWithGoogle(payload: {
  id_token?: string;
  code?: string;
  dev_email?: string;
  dev_name?: string;
}): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${getBaseUrl()}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<{ access_token: string; user: UserProfile }>(res);
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function loginUser(username: string, password: string): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await handleResponse<{ access_token: string; user: UserProfile }>(res);
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  org_name: string;
  title?: string;
  role?: string;
  discord_id?: string;
}): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${getBaseUrl()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<{ access_token: string; user: UserProfile }>(res);
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetchWithAuth(`${getBaseUrl()}/auth/me`);
    if (res.status === 401) {
      setAuthToken(null);
      return null;
    }
    return handleResponse<UserProfile>(res);
  } catch {
    setAuthToken(null);
    return null;
  }
}

export async function submitOnboarding(data: OnboardingProfileData): Promise<{ status: string; project_id: string; user: UserProfile }> {
  const res = await fetchWithAuth(`${getBaseUrl()}/auth/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse<{ status: string; project_id: string; user: UserProfile }>(res);
}

export async function logoutUser(): Promise<void> {
  try {
    await fetchWithAuth(`${getBaseUrl()}/auth/logout`, { method: 'POST' });
  } catch {
    // Ignore network error on logout
  } finally {
    setAuthToken(null);
  }
}

// ----------------- Core Endpoints -----------------

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects`);
  return handleResponse<Project[]>(res);
}

export async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
  if (!projectId) {
    return {
      assets: 0,
      findings: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      by_stage: { recon: 0, config: 0, vuln: 0 }
    };
  }
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/stats`);
  return handleResponse<ProjectStats>(res);
}

export async function loadDemoScenario(projectId: string = 'prj_demo') {
  if (!projectId) return null;
  const res = await fetchWithAuth(`${getBaseUrl()}/seed/load-demo?project_id=${encodeURIComponent(projectId)}`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function fetchFindings(projectId: string, filters?: { stage?: string; severity?: string; q?: string }): Promise<Finding[]> {
  if (!projectId) return [];
  const params = new URLSearchParams();
  if (filters?.stage) params.set('stage', filters.stage);
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.q) params.set('q', filters.q);
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/findings?${params.toString()}`);
  return handleResponse<Finding[]>(res);
}

export async function fetchGraph(projectId: string, depth: number = 2, focus?: string) {
  if (!projectId) return { nodes: [], edges: [] };
  const params = new URLSearchParams({ depth: depth.toString() });
  if (focus) params.set('focus', focus);
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/graph?${params.toString()}`);
  return handleResponse<any>(res);
}

export async function correlateProject(projectId: string, useLlm: boolean = true) {
  if (!projectId) return [];
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/correlate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'hybrid', use_llm: useLlm })
  });
  return handleResponse<any>(res);
}

export async function fetchChains(projectId: string): Promise<AttackChain[]> {
  if (!projectId) return [];
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/chains`);
  return handleResponse<AttackChain[]>(res);
}

export async function fetchChain(chainId: string): Promise<AttackChain> {
  const res = await fetchWithAuth(`${getBaseUrl()}/chains/${chainId}`);
  return handleResponse<AttackChain>(res);
}

export async function planVerification(chainId: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/chains/${chainId}/plan`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function runPlan(planId: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/plans/${planId}/run`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function fetchApprovals(): Promise<ApprovalCard[]> {
  const res = await fetchWithAuth(`${getBaseUrl()}/approvals?status=pending`);
  return handleResponse<ApprovalCard[]>(res);
}

export async function approveCard(cardId: string, justification: string, narrow?: any) {
  const res = await fetchWithAuth(`${getBaseUrl()}/approvals/${cardId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ justification, narrow })
  });
  return handleResponse<{ status: string; token: string }>(res);
}

export async function denyCard(cardId: string, reason: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/approvals/${cardId}/deny`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  return handleResponse<{ status: string }>(res);
}

export async function executeStepWithToken(stepId: string, token: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/executions/run-step?step_id=${encodeURIComponent(stepId)}&token=${encodeURIComponent(token)}`, {
    method: 'POST'
  });
  return handleResponse<any>(res);
}

export async function executeStep(stepId: string, token: string) {
  return executeStepWithToken(stepId, token);
}

export async function fetchRemediations(projectId: string): Promise<RemediationItem[]> {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/remediation`);
  return handleResponse<RemediationItem[]>(res);
}

export async function simulateFix(projectId: string, excludedFindingIds: string[]) {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/simulate-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(excludedFindingIds)
  });
  return handleResponse<any>(res);
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
  const res = await fetchWithAuth(`${getBaseUrl()}/audit?limit=200`);
  return handleResponse<AuditEvent[]>(res);
}

export async function verifyAuditLedger() {
  const res = await fetchWithAuth(`${getBaseUrl()}/audit/verify`);
  return handleResponse<any>(res);
}

export async function triggerKillSwitch(reason?: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/kill?reason=${encodeURIComponent(reason || 'Operator kill switch')}`, {
    method: 'POST'
  });
  return handleResponse<any>(res);
}

export async function resetKillSwitch() {
  const res = await fetchWithAuth(`${getBaseUrl()}/kill/reset`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function fetchPublicConfig() {
  const res = await fetchWithAuth(`${getBaseUrl()}/config/public`);
  return handleResponse<any>(res);
}

export async function fetchRejectedHypotheses(chainId: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/chains/${chainId}/rejections`);
  return handleResponse<any>(res);
}

export async function fetchProjectRejections(projectId: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/rejections`);
  return handleResponse<any>(res);
}

export async function fetchAssets(projectId: string, zone?: string, type?: string): Promise<AssetItem[]> {
  let url = `${getBaseUrl()}/projects/${projectId}/assets`;
  const params = new URLSearchParams();
  if (zone) params.append('zone', zone);
  if (type) params.append('type', type);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetchWithAuth(url);
  return handleResponse<AssetItem[]>(res);
}

export async function createAsset(projectId: string, payload: {
  name: string;
  type?: string;
  zone?: string;
  ip?: string;
  services?: any[];
  datastores?: string[];
  tags?: string[];
}): Promise<AssetItem> {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<AssetItem>(res);
}

export async function deleteAsset(projectId: string, assetId: string) {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}/assets/${assetId}`, {
    method: 'DELETE'
  });
  return handleResponse<any>(res);
}

export async function createNewProject(payload: {
  name: string;
  description?: string;
  scope: { cidrs?: string[]; domains?: string[]; lab_only?: boolean };
}): Promise<Project> {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<Project>(res);
}

export async function updateProject(projectId: string, payload: {
  name: string;
  description?: string;
  scope: { cidrs?: string[]; domains?: string[]; lab_only?: boolean };
}): Promise<Project> {
  const res = await fetchWithAuth(`${getBaseUrl()}/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<Project>(res);
}

export async function fetchPolicy(): Promise<{ default: string; rules: PolicyRule[] }> {
  const res = await fetchWithAuth(`${getBaseUrl()}/policy`);
  return handleResponse<{ default: string; rules: PolicyRule[] }>(res);
}

export async function downloadReport(projectId: string, format: 'md' | 'sarif') {
  window.open(`${getBaseUrl()}/projects/${projectId}/reports/download?format=${format}`, '_blank');
}
