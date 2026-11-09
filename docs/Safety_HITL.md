# Safety, Threat Model & HITL Design - ChainedRisk

## 1. Safety Philosophy
Autonomy is bounded by **deny-by-default policy**, **explicit human approval for any active step**, **hard isolation**, and **complete auditability**. The LLM suggests; deterministic code decides; a human authorizes.

## 2. Assets to Protect
Host machine and network; non-lab systems; secrets/evidence; approval integrity; audit integrity; the user's reputation (no out-of-scope probing).

## 3. Threat Model (STRIDE-oriented)
| ID | Threat | Vector | Control |
|---|---|---|---|
| T1 | LLM hallucinated or unsafe action | Model output | Allowlisted actions only; schema-validated params; validator; no shell strings |
| T2 | Prompt injection through scanner output/evidence | Malicious banner/page content | Evidence wrapped as quoted data, instruction-hierarchy system prompt, output JSON-schema constrained, action allowlist makes injected "commands" inert |
| T3 | Out-of-scope targeting | Parameter manipulation, DNS tricks | Scope allowlist of lab assets by id; resolve-then-verify IP in lab CIDR at execution; runner network has no external route |
| T4 | Approval bypass/replay | Forged or reused token | HMAC token bound to command hash+target+exp+nonce; single-use; server-side state machine |
| T5 | Approval fatigue / rubber-stamping | Many cards | Cards batched by chain, risk-ordered, concise; L2 requires justification; daily approval stats; rate-limit card creation |
| T6 | Social engineering via Discord | Spoofed user | Ed25519 interaction signature; approver allowlist by Discord ID mapped to user; optional separate-approver rule |
| T7 | Container escape | Runner exploit | Non-root, cap-drop ALL, no-new-privileges, seccomp, read-only rootfs, pids/mem/cpu limits, no docker.sock inside runner; API uses docker-socket-proxy |
| T8 | Data exfil from sandbox | Runner egress | Internal-only network, no gateway; DNS limited to lab names |
| T9 | Tampering with audit | DB edit | Hash chain + verify endpoint; optional external anchor |
| T10 | Secret leakage in UI/reports | Evidence | Redaction at ingest and render; role-gated raw view |
| T11 | Malicious uploaded files (zip bomb, XXE) | Ingest | Size limits, defusedxml, streaming parsers, no entity expansion |
| T12 | Privilege escalation in app | API | RBAC checks, JWT expiry, CSRF, input validation |
| T13 | Time-of-check/time-of-use on command | Param change post-approval | Executor recomputes command hash from stored step; mismatch aborts |
| T14 | Runaway execution | Bug | Hard timeout, kill switch, global lock |

## 4. Action Catalog (MVP allowlist)
| Action | Risk | Description | Side effects |
|---|---|---|---|
| http_get_probe | L1 | GET one URL, record status/headers/snippet | none |
| git_exposure_check | L1 | GET /.git/config, /.git/HEAD | none |
| ssrf_canary_probe | L1 | Request internal URL through SSRF param, expect marker/banner | none (read-only protocols only: http/https; no gopher/dict/file) |
| tcp_connect_check | L1 | TCP connect, no payload | none |
| redis_unauth_ping | L1 | Send `PING`, expect `+PONG` | none |
| redis_info_readonly | L1 | Send `INFO server` | none |
| lab_write_canary | L2 | Write harmless canary key `chained:canary:<nonce>` then delete | reversible state change in lab |
| (any exploit/RCE/config-set/flush/shell) | L3 | **Not implemented in MVP; always denied** | - |
Design note: verification proves *reachability and missing auth*, not exploitation. Chain status "Confirmed" means every precondition was observed, not that code execution occurred.

## 5. Policy Engine
```yaml
default: deny
rules:
  - id: scope-lab-only
    when: {target.zone: not_in [lab]}
    then: deny
  - id: l3-deny
    when: {risk: L3}
    then: deny
  - id: l0-auto
    when: {risk: L0}
    then: allow
  - id: l1-approve
    when: {risk: L1}
    then: require_approval {approvers: 1, ttl_s: 600}
  - id: l2-approve-justify
    when: {risk: L2}
    then: require_approval {approvers: 1, justification: true, ttl_s: 300, separate_approver: true}
  - id: kill-lock
    when: {system.locked: true}
    then: deny
  - id: business-hours-optional
    when: {time.outside: "08:00-22:00"}
    then: require_approval {escalate: true}
```

## 6. Approval Protocol
State machine: `PENDING -> APPROVED -> CONSUMED` | `DENIED` | `EXPIRED` | `CANCELLED`.
1. Planner builds step; policy returns `require_approval`.
2. Card created with immutable fields (command, hash, target, risk, blast radius, reason). Agent pauses.
3. Human decides. Narrowing mutates params -> new hash -> card re-issued (version+1) for re-confirmation.
4. On approve: server issues token; stores nonce.
5. Executor verifies token (HMAC, exp, nonce unused, hash == sha256(canonical(action, params, target)), lock off, policy re-eval).
6. Run; consume nonce; audit; update chain status.
Cards expire (default 10 min). No auto-approve path exists in code (static check in CI greps for forbidden patterns; unit test asserts `execute()` raises without token).

## 7. Blast Radius Model
See SystemDesign.md section 4. Inputs: reachable assets (2 hops), datastore sensitivity, state-change class, credentials in scope, network scope. Output: score, level, human-readable summary and mini-graph.

## 8. Sandbox Hardening Checklist
- Pinned runner image, built from distroless/python-slim, non-root UID 10001
- `--read-only`, tmpfs `/tmp` 16m, `--cap-drop=ALL`, `--security-opt no-new-privileges`, default seccomp, AppArmor if available
- `--pids-limit 64 --memory 128m --cpus 0.5`, timeout 20s via controller (stop+rm)
- Network `chained_lab` created with `--internal`, static subnet 10.77.0.0/24
- No volumes except evidence output mount (write-only dir, size-limited) - or return results through container logs JSON
- Lab targets run as non-root, no host mounts, resource-limited, reset to clean state after each run (`docker compose restart`)
- Runner wrapper re-validates target IP is inside lab subnet before any connection

## 9. Kill Switch
Always visible. Action: lock system, stop containers with label `chained.run=true`, cancel pending cards, emit `system.locked`, audit `KILL`. Unlock requires admin + reason.

## 10. Audit Events
`INGEST, CORRELATE, HYPOTHESIS_REJECTED, PLAN_CREATED, CARD_CREATED, CARD_VIEWED, APPROVED, DENIED, EXPIRED, TOKEN_ISSUED, EXEC_STARTED, EXEC_FINISHED, KILL, UNLOCK, POLICY_CHANGED, LOGIN, EXPORT`.

## 11. Responsible Use
Only run against owned/authorized assets; the shipped lab is synthetic. README and UI display an authorization acknowledgement at project creation (required checkbox stored in audit).
