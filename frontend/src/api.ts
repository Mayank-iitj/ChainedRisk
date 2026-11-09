import {
  Project,
  ProjectStats,
  Finding,
  AttackChain,
  ApprovalCard,
  AuditEvent,
  RemediationItem,
  UserProfile,
  OnboardingProfileData
} from './types';

const BASE_URL = '/api/v1';

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
  const res = await fetch(`${BASE_URL}/auth/google/config`);
  return handleResponse<{ client_id: string }>(res);
}

export async function authenticateWithGoogle(payload: {
  id_token?: string;
  code?: string;
  dev_email?: string;
  dev_name?: string;
}): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/auth/google`, {
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
  const res = await fetch(`${BASE_URL}/auth/login`, {
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
  const res = await fetch(`${BASE_URL}/auth/register`, {
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

export async function fetchCurrentUser(): Promise<UserProfile> {
  const res = await fetchWithAuth(`${BASE_URL}/auth/me`);
  return handleResponse<UserProfile>(res);
}

export async function submitOnboarding(data: OnboardingProfileData): Promise<{ status: string; project_id: string; user: UserProfile }> {
  const res = await fetchWithAuth(`${BASE_URL}/auth/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse<{ status: string; project_id: string; user: UserProfile }>(res);
}

export async function logoutUser(): Promise<void> {
  try {
    await fetchWithAuth(`${BASE_URL}/auth/logout`, { method: 'POST' });
  } catch {
    // Ignore network error on logout
  } finally {
    setAuthToken(null);
  }
}

// ----------------- Core Endpoints -----------------

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetchWithAuth(`${BASE_URL}/projects`);
  return handleResponse<Project[]>(res);
}

export async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/stats`);
  return handleResponse<ProjectStats>(res);
}

export async function loadDemoScenario(projectId: string = 'prj_demo') {
  const res = await fetchWithAuth(`${BASE_URL}/seed/load-demo?project_id=${encodeURIComponent(projectId)}`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function fetchFindings(projectId: string, filters?: { stage?: string; severity?: string; q?: string }): Promise<Finding[]> {
  const params = new URLSearchParams();
  if (filters?.stage) params.set('stage', filters.stage);
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.q) params.set('q', filters.q);
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/findings?${params.toString()}`);
  return handleResponse<Finding[]>(res);
}

export async function fetchGraph(projectId: string, depth: number = 2, focus?: string) {
  const params = new URLSearchParams({ depth: depth.toString() });
  if (focus) params.set('focus', focus);
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/graph?${params.toString()}`);
  return handleResponse<any>(res);
}

export async function correlateProject(projectId: string, useLlm: boolean = true) {
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/correlate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'hybrid', use_llm: useLlm })
  });
  return handleResponse<any>(res);
}

export async function fetchChains(projectId: string): Promise<AttackChain[]> {
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/chains`);
  return handleResponse<AttackChain[]>(res);
}

export async function fetchChain(chainId: string): Promise<AttackChain> {
  const res = await fetchWithAuth(`${BASE_URL}/chains/${chainId}`);
  return handleResponse<AttackChain>(res);
}

export async function planVerification(chainId: string) {
  const res = await fetchWithAuth(`${BASE_URL}/chains/${chainId}/plan`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function runPlan(planId: string) {
  const res = await fetchWithAuth(`${BASE_URL}/plans/${planId}/run`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function fetchApprovals(): Promise<ApprovalCard[]> {
  const res = await fetchWithAuth(`${BASE_URL}/approvals?status=pending`);
  return handleResponse<ApprovalCard[]>(res);
}

export async function approveCard(cardId: string, justification: string, narrow?: any) {
  const res = await fetchWithAuth(`${BASE_URL}/approvals/${cardId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ justification, narrow })
  });
  return handleResponse<{ status: string; token: string }>(res);
}

export async function denyCard(cardId: string, reason: string) {
  const res = await fetchWithAuth(`${BASE_URL}/approvals/${cardId}/deny`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  return handleResponse<{ status: string }>(res);
}

export async function executeStepWithToken(stepId: string, token: string) {
  const res = await fetchWithAuth(`${BASE_URL}/executions/run-step?step_id=${encodeURIComponent(stepId)}&token=${encodeURIComponent(token)}`, {
    method: 'POST'
  });
  return handleResponse<any>(res);
}

export async function executeStep(stepId: string, token: string) {
  return executeStepWithToken(stepId, token);
}

export async function fetchRemediations(projectId: string): Promise<RemediationItem[]> {
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/remediation`);
  return handleResponse<RemediationItem[]>(res);
}

export async function simulateFix(projectId: string, excludedFindingIds: string[]) {
  const res = await fetchWithAuth(`${BASE_URL}/projects/${projectId}/simulate-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(excludedFindingIds)
  });
  return handleResponse<any>(res);
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
  const res = await fetchWithAuth(`${BASE_URL}/audit?limit=200`);
  return handleResponse<AuditEvent[]>(res);
}

export async function verifyAuditLedger() {
  const res = await fetchWithAuth(`${BASE_URL}/audit/verify`);
  return handleResponse<any>(res);
}

export async function triggerKillSwitch(reason?: string) {
  const res = await fetchWithAuth(`${BASE_URL}/kill?reason=${encodeURIComponent(reason || 'Operator kill switch')}`, {
    method: 'POST'
  });
  return handleResponse<any>(res);
}

export async function resetKillSwitch() {
  const res = await fetchWithAuth(`${BASE_URL}/kill/reset`, { method: 'POST' });
  return handleResponse<any>(res);
}

export async function fetchPublicConfig() {
  const res = await fetchWithAuth(`${BASE_URL}/config/public`);
  return handleResponse<any>(res);
}

export async function fetchRejectedHypotheses(chainId: string) {
  const res = await fetchWithAuth(`${BASE_URL}/chains/${chainId}/rejections`);
  return handleResponse<any>(res);
}

export async function downloadReport(projectId: string, format: 'md' | 'sarif') {
  window.open(`${BASE_URL}/projects/${projectId}/reports/download?format=${format}`, '_blank');
}
