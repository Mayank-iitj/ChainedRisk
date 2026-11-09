# UI/UX Specification - ChainedRisk

## 1. Design Principles
1. **Chains over alerts**: the primary object is the attack path, not the finding.
2. **Safety is visible**: gate state, risk level and kill switch are always on screen.
3. **Explain everything**: every claim links to evidence.
4. **Decide fast**: approval in <=2 clicks with all facts on one card.
5. **Calm, dense, readable**: dark-first SOC aesthetic, WCAG 2.1 AA.

## 2. Information Architecture
```
/login
/projects                     Project list
/projects/:id/overview        KPIs: findings -> chains reduction, top chains, pending approvals
/projects/:id/ingest          Upload + parse results + source health
/projects/:id/graph           Knowledge graph explorer
/projects/:id/findings        Table with filters
/projects/:id/chains          Ranked chain list
/projects/:id/chains/:cid     Chain detail (stepper + graph path + evidence + plan)
/approvals                    Approval queue (all projects)
/executions/:id               Live run console
/projects/:id/remediation     Min-cut fix plan
/projects/:id/reports         Generate/download
/audit                        Hash-chained log + verify badge
/settings                     Policy, integrations, users (admin)
```
Global shell: left nav, top bar with project switcher, **System Safety Bar** (Lab-only badge, Pending approvals count, LLM on/off, Audit verified tick, red KILL button).

## 3. Key Screens

### 3.1 Overview
- KPI strip: Findings (312) -> Chains (4) "98.7% noise reduction"; Critical chains; Pending approvals; Verified chains.
- Card "Severity illusion": bar showing individual severities (Low, Med, Med) vs chain score (Critical 91).
- Top 5 chains list with score badge, steps count, status chip.
- Recommended fix widget: "Fix 2 findings -> breaks 4 of 4 chains".

### 3.2 Ingest
- Drag-drop zone, tool auto-detect chips (nmap, nuclei, httpx, gitleaks, headers, ZAP), per-file progress, parse report (created/dupes/errors with line numbers), stage badge (Recon / Config / Vuln) forming a 3-column "assessment stages" coverage indicator.

### 3.3 Graph Explorer (Cytoscape)
- Layout: cola/dagre toggle; zones as compound nodes (External, DMZ, Internal, Lab).
- Node styling: shape by type (host square, service circle, endpoint diamond, datastore cylinder, finding hexagon); color by severity (info gray, low blue, medium amber, high orange, critical red); derived edges dashed.
- Interactions: click node -> side panel (details, findings, evidence); "Show chains through this node"; filter chips; search; path highlight when hovering a chain; mini-map; export PNG.
- Performance: virtualize >2000 nodes; collapse low-severity clusters.

### 3.4 Chains List
Columns: Score, Severity chip, Title, Steps, Max individual severity, Chain gain (+47), Confidence, Origin (rule/LLM), Status. Sort/filter; bulk dismiss. Row expands with step mini-timeline.

### 3.5 Chain Detail
- Header: title, score ring, chain gain, MITRE tags, status.
- Left: **vertical stepper** (Step 1..n): finding title + severity chip + asset + "provides -> requires" capability pills; "View evidence" drawer (request/response, redacted secrets).
- Right: graph highlighting only the path with animated edge flow.
- Tabs: Explanation (AI narrative with citations [F-12]), Evidence, Remediation, Rejected hypotheses (shows validator rigor), Verification Plan.
- CTA: **Generate verification plan** -> **Run (step-by-step)**.

### 3.6 Approval Card (modal + queue item + Discord embed) - hero component
```
+----------------------------------------------------------+
| [L1] APPROVAL REQUIRED          Chain C-03 - Step 2 of 3  |
| Verify SSRF -> Redis pivot            expires in 09:42    |
|----------------------------------------------------------|
| COMMAND (exact, copyable)                                 |
| $ ssrf_canary_probe --url http://app.lab:8080/fetch?u=   |
|   http://redis.lab:6379/ --expect reachable                   |
| hash sha256:cd34...                                       |
|----------------------------------------------------------|
| TARGET     redis-lab  10.77.0.12 (via app-lab)  [lab-only]|
| RISK       L1  read-only - reversible - no state change   |
| BLAST RADIUS  score 28/100                                |
|   [mini-graph: app-lab -> redis-lab highlighted]          |
|   2 hosts - 1 datastore (synthetic) - 0 credentials       |
| WHY  F-12 SSRF grants net_pivot_internal; F-17 Redis      |
|      no-auth requires it.  [view evidence]                |
| ROLLBACK none needed   TIMEOUT 20s   NETWORK lab-only     |
|----------------------------------------------------------|
| [ Deny ]   [ Narrow scope ]            [ Approve & run ]  |
+----------------------------------------------------------+
```
Behaviors: Approve disabled until card scrolled/checkbox "I reviewed command & target" for L2; L2 requires justification text; countdown timer; keyboard shortcuts A/D/N; after decision card shows signed receipt (approver, time, hash). Command is monospaced with token highlighting; params diff shown when narrowed. Color semantics: L0 green, L1 blue, L2 amber, L3 red (blocked, no approve button).

### 3.7 Execution Console
Terminal-style streaming log (WebSocket), status stepper (Approved -> Container started -> Running -> Verdict), verdict banner (Confirmed / Not reproduced / Blocked), evidence attachments, "Stop" button, elapsed timer, resource caps displayed.

### 3.8 Remediation
Table of "fix -> chains broken -> effort -> owner" with before/after chain count simulation slider ("simulate fix": re-run correlation with finding removed).

### 3.9 Audit
Timeline table; filter by type; "Verify integrity" button -> green banner with head hash; click event for JSON.

### 3.10 Settings
Policy editor (YAML with lint), approver allowlist, Discord connect/test, LLM toggle/model, TTL, separate-approver toggle.

## 4. Discord Experience
Embed colors by risk; fields mirror card; buttons Approve/Deny/Details; after decision, message edited to "Approved by @user at HH:MM - executing" and buttons removed; follow-up thread posts verdict + evidence summary.

## 5. Design Tokens
| Token | Value |
|---|---|
| bg-base | #0B0F14 |
| bg-surface | #121821 |
| border | #1F2A37 |
| text-primary | #E6EDF3 |
| text-muted | #8B98A9 |
| accent | #3B82F6 |
| sev-info/low/med/high/crit | #64748B / #38BDF8 / #F59E0B / #F97316 / #EF4444 |
| risk L0/L1/L2/L3 | #22C55E / #3B82F6 / #F59E0B / #EF4444 |
| font-ui | Inter; font-mono | JetBrains Mono |
| radius | 10px; spacing scale 4px |
Light theme supported via CSS variables.

## 6. Components
SafetyBar, KpiTile, SeverityChip, RiskBadge, CapabilityPill, ChainStepper, GraphCanvas, EvidenceDrawer, ApprovalCard, CommandBlock, BlastRadiusMiniGraph, CountdownTimer, ExecutionConsole, AuditVerifyBanner, KillButton (confirm dialog), FileDropzone, FilterBar, DiffViewer.

## 7. States & Edge Cases
Empty (no data -> "Load demo scenario" button), loading skeletons, LLM unavailable banner (rules-only), approval expired (card greyed, "Re-request"), system locked (full-width red banner, all run buttons disabled), partial parse errors (warnings list), long chains (collapse middle steps).

## 8. Accessibility
Color never sole indicator (icons + text for severity/risk); focus rings; ARIA live region for new approval requests; contrast >= 4.5:1; keyboard-operable graph (list view alternative); reduced-motion setting disables edge animation.

## 9. Responsive
>=1280 full layout; 768-1279 collapsible nav, side panels become drawers; mobile: approval queue + card optimized (approve from phone), graph read-only.

## 10. Copywriting Guidelines
Plain, specific, no fear language. Examples: "3 findings combine into a path to Redis", "Nothing runs until you approve", "Read-only probe, lab network only".

## 11. Usability Test Plan
5 users; tasks: ingest demo, find top chain, explain it, approve/deny a card, find which fix breaks most chains. Success: all tasks <3 min, 0 misreads of command/target on the card.
