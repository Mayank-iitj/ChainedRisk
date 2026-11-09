# Product Requirements Document (PRD) - ChainedRisk
Version 1.0 | Status: Ready for build

## 1. Overview
ChainedRisk is a defensive security analysis platform that converts siloed scanner output into prioritized, explainable **attack chains**, and
safely validates them in a sandbox through a **human-in-the-loop (HITL) approval gate** that shows the exact command, target, blast radius, and rationale before anything active runs.

## 2. Problem Statement
- Scanners produce hundreds to thousands of findings; per-finding severity (CVSS) ignores context and combination.
- Teams triage by severity, so "Low" and "Medium" items that form a critical chain are ignored.
- Existing attack-path tools are heavy, cloud/AD-specific, or black-box; autonomous exploit agents lack safety controls.
- Result: alert fatigue, missed breach paths, unsafe/unauditable automated validation.

## 3. Goals / Non-Goals
### Goals
- G1. Ingest multi-stage assessment data (recon, config, vuln) into one knowledge graph.
- G2. Produce ranked attack chains where every step cites concrete evidence (finding IDs, raw output).
- G3. Show "chain risk" vs "max individual severity" to prove the value of correlation.
- G4. Verify chains in a sandbox only after explicit human approval with full blast-radius disclosure.
- G5. Full audit trail; reproducible, explainable output; works offline with deterministic rules even without an LLM.

### Non-Goals
- Not an exploitation framework; no weaponized payloads, persistence, or evasion.
- No scanning of out-of-scope or third-party targets. No production exploitation.
- Not a scanner replacement (it consumes scanner output).
- Not a SIEM / runtime detector (v1).

## 4. Personas
| Persona | Needs |
|---|---|
| P1 Priya, SOC/VM analyst | Fewer, better alerts; clear "why this matters"; one-click approve/deny |
| P2 Arjun, pentester/red-teamer | Fast path hypotheses, evidence, reproducible verification commands |
| P3 Meera, security manager | Risk-reduction view, "fix this one thing, break N chains", audit trail |
| P4 Dev, DevOps owner | Actionable remediation per chain, minimal noise |
| P5 Judge/evaluator | Clear demo of correlation, reasoning, safety gating |

## 5. User Stories & Acceptance Criteria
| ID | Story | Acceptance |
|---|---|---|
| US-01 | Upload nmap/nuclei/httpx/gitleaks/header output for a project | Files parsed and normalized; counts shown; invalid files rejected with line-level error |
| US-02 | See assets and findings as an interactive graph | Renders up to 2000 nodes in <3s; filter by severity/type/zone |
| US-03 | Click "Correlate" and get ranked chains | >=1 chain for demo dataset; each step links to evidence; <60s with LLM, <5s rules-only |
| US-04 | Compare chain risk vs individual severity | UI shows individual severities (Low/Med/Med) and chain score (Critical) |
| US-05 | Request verification of a chain | Verification Plan with discrete steps, each with action, target, risk level |
| US-06 | See an Approval Card before any active step | Card shows exact command, target container, risk level, blast radius, reason, rollback, expiry |
| US-07 | Approve/deny/narrow via web UI or Discord | Decision recorded with identity, timestamp, command hash; approvals single-use and expiring |
| US-08 | Denied/expired steps never execute | Executor rejects any step without valid signed approval token |
| US-09 | See live execution output and verdict | Verdicts: Confirmed / Not reproduced / Blocked / Error; logs streamed over WebSocket |
| US-10 | See remediation ranked by chains broken | "Fix X breaks N chains" via min-cut |
| US-11 | Export report (PDF/Markdown/JSON/SARIF) | Includes chains, evidence, approvals, audit log |
| US-12 | View tamper-evident audit log | Hash chain verifies; UI shows verified badge |
| US-13 | Kill all running verification instantly | Containers stopped <3s; approvals locked |

## 6. Functional Requirements
**FR-1 Ingestion (DataOps)** - Parsers: nmap XML, subfinder/amass JSONL, httpx JSONL, nuclei JSONL, gitleaks/trufflehog JSON, security-headers JSON, ZAP JSON, generic CSV mapping, manual finding form. Normalize to unified Finding schema with `stage` (recon|config|vuln), asset reference, evidence, source tool, raw hash. Idempotent (dedupe on raw hash + asset + rule id). Provenance retained.

**FR-2 Knowledge Graph** - Node types: Asset (Domain, Host, Service, Endpoint, Container, Network), Finding, Capability, Credential, DataStore. Edge types: EXPOSES, HAS_FINDING, GRANTS, REQUIRES, CAN_REACH, RUNS, AUTHENTICATES_TO. Backend: NetworkX in memory + SQLite persistence by default; Neo4j via adapter.

**FR-3 Chain Engine** - Deterministic YAML rule library with preconditions/postconditions mapped to MITRE ATT&CK; AI reasoning node proposes extra hypotheses; every hypothesis validated against the graph (no unsupported steps); scoring = likelihood x impact with chain-gain; dedupe; top-N ranking.

**FR-4 Verification Planner** - Converts chain steps to safe templated actions from an allowlist (e.g. `http_get`, `redis_ping_unauth`, `ssrf_canary_probe`); the LLM never emits free-form shell. Each action declares side effects, reversibility and blast-radius model.

**FR-5 HITL Gate** - Policy engine classifies risk L0-L3; L0 passive auto-allowed, L1+ require approval, L3 denied by default. Approval Card in Web UI and Discord (buttons). Reviewer may narrow scope. Signed single-use approval token bound to command hash + target + expiry.

**FR-6 Sandbox Executor** - Ephemeral hardened containers on an isolated Docker network; timeouts, resource caps, egress deny; kill switch.

**FR-7 Reporting & Remediation** - Min-cut remediation, executive summary, exports.

**FR-8 Audit** - Append-only hash-chained log of ingest, correlate, plan, approve, execute, kill.

## 7. Non-Functional Requirements
- Performance: ingest 10k findings <30s; correlate 2k nodes <60s.
- Reliability: restart-safe state (SQLite); idempotent jobs.
- Security: RBAC, secrets via env, sandbox with no outbound internet.
- Explainability: 100% of chain steps evidence-linked.
- Accessibility: WCAG 2.1 AA.
- Portability: `docker compose up`.

## 8. Success Metrics
| Metric | Target |
|---|---|
| Alert reduction (findings -> chains) | >=90% fewer items to review on demo set |
| Chain precision (labelled set) | >=0.85 |
| Chain recall (labelled set) | >=0.80 |
| Hallucinated step rate | 0% (validator-enforced) |
| Unapproved active executions | 0 (hard invariant) |
| Time to first chain | <10 min from upload |
| Median approval decision time | <30 s |

## 9. Scope Phasing
- **MVP (48h):** parsers (nmap, nuclei, gitleaks, headers, httpx), NetworkX graph, rules + LLM chains, 3 verification actions, web + Discord approvals, Docker lab, audit log, MD/JSON reports.
- **V1:** Neo4j, SARIF, RBAC/SSO, more parsers, min-cut, scheduling.
- **V2:** cloud/IAM graph, Jira ticketing, continuous diffing, detection rule export.

## 10. Assumptions & Constraints
Authorized scope only; lab isolated; LLM optional (rules fallback); English UI; single-tenant for MVP.

## 11. Open Questions
Default LLM provider (Claude API with local fallback), chat platform for v1 (Discord), multi-tenant timing (V1).
