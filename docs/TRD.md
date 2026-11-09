# Technical Requirements Document (TRD) - ChainedRisk
Version 1.0

## 1. Technology Stack
| Layer | Choice | Rationale |
|---|---|---|
| Backend API | Python 3.11, FastAPI, Pydantic v2, Uvicorn | Async, typed schemas, auto OpenAPI |
| Graph | NetworkX 3.x (default), Neo4j 5 (optional adapter) | Zero-dependency demo; scalable option |
| Persistence | SQLite (WAL) via SQLAlchemy 2; Postgres-compatible | Restart-safe, simple |
| Job queue | asyncio background tasks + APScheduler (MVP); Redis+RQ (V1) | Keep MVP light |
| LLM | Anthropic API (Claude) via SDK; pluggable provider interface; offline fallback = rules only | Structured JSON outputs |
| Executor | Docker SDK for Python, dedicated `chained_lab` network | Isolation |
| Frontend | React 18, Vite, TypeScript, Tailwind, Cytoscape.js, Zustand, TanStack Query | Graph UX |
| Realtime | WebSocket (FastAPI) | Live logs, approval events |
| Chat HITL | discord.py 2.x (buttons/interactions) | Approval anywhere |
| Crypto | HMAC-SHA256 (approval tokens), SHA-256 hash chain (audit) | Tamper evidence |
| Packaging | Docker Compose | One-command run |
| Tests | pytest, hypothesis, Playwright, schemathesis | Property + E2E + API fuzz |

## 2. Component Requirements
### 2.1 Ingestion service
- Parser interface: `parse(file_bytes, meta) -> list[NormalizedRecord]`; registry keyed by `source_tool`.
- Streaming parse for files >50 MB; max upload 200 MB; reject unknown MIME; size/zip-bomb guards.
- Normalization: severity map to {info, low, medium, high, critical}; CWE/CVE extraction; asset resolution (hostname/IP/port -> canonical asset id `host:10.0.0.5`, `svc:10.0.0.5:6379/tcp`, `ep:https://app.lab/admin`).
- Dedup key: `sha256(source_tool|rule_id|asset_id|evidence_digest)`.
- Output: nodes/edges upserted in one transaction.

### 2.2 Graph service
- API: `upsert_node`, `upsert_edge`, `neighbors`, `subgraph(asset_ids, depth)`, `export_json`.
- Capability model: findings declare `provides` (postconditions) and `requires` (preconditions) as capability tokens (see DataModel.md).
- Reachability: `CAN_REACH` edges derived from network zones + discovered open ports + SSRF-derived pivots (pivot edges flagged `derived=true`).

### 2.3 Chain engine
Pipeline: (1) candidate generation by rules, (2) LLM hypothesis generation, (3) validation, (4) scoring, (5) dedupe/rank, (6) explanation.
- Rule engine: YAML rules; matching via graph search (BFS/DFS with capability unification); max chain length 6; max candidates 500; time budget 30s.
- LLM node: input = compact subgraph summary (<= 8k tokens) + capability vocabulary; output = strict JSON (schema `chain_hypothesis.json`); temperature 0.2; 1 repair retry.
- Validator (deterministic, mandatory): each step must (a) reference existing finding/asset IDs, (b) satisfy requires from earlier provides or initial attacker capability, (c) have edge reachability, (d) not use disallowed capability. Failing hypotheses are dropped and logged; never shown as confirmed.
- Scoring formula (documented in AI_Reasoning.md):
  - step likelihood p_i from exploitability tags {trivial 0.9, easy 0.7, moderate 0.4, hard 0.15}, adjusted by evidence confidence.
  - chain likelihood L = prod(p_i). impact I = max impact of terminal capability (data_exfil 0.9, rce 1.0, cred_theft 0.8, dos 0.4, info 0.2). chain_score = round(100 * (0.6*I + 0.4*L^(1/n)))  where n = steps.
  - chain_gain = chain_score - max(individual_finding_score). Severity bands: >=80 Critical, 60-79 High, 40-59 Medium, <40 Low.
- Min-cut remediation: build directed chain-union graph; compute minimum set of findings/edges whose removal disconnects all attacker->crown-jewel paths (greedy set cover on chains, optional max-flow via NetworkX `minimum_node_cut`).

### 2.4 Verification planner
- Action catalog (allowlisted templates; see Safety_HITL.md): `http_get_probe`, `http_head_probe`, `git_exposure_check`, `ssrf_canary_probe`, `redis_unauth_ping`, `redis_info_readonly`, `tcp_connect_check`.
- Parameters validated by JSON Schema; target must resolve to a lab asset in scope; templates rendered server-side; **LLM may choose action ids + parameters only**.
- Output: ordered `VerificationStep[]` with `risk_level`, `blast_radius`, `reversible`, `command_preview`, `command_hash`.

### 2.5 Policy engine
- Rules in YAML evaluated top-down; deny-by-default. Inputs: action, target, scope, risk, time, requester.
- Risk levels: L0 passive/read-only on pre-collected data; L1 active read-only network probe in lab; L2 active probe with possible state change/reversible; L3 destructive/irreversible/out-of-lab (always denied in MVP).
- Approval requirement: L0 auto, L1 one approver, L2 one approver + justification text, L3 deny.

### 2.6 Approval service
- Token: `base64url(payload).hmac` with payload `{card_id, step_id, command_hash, target, approver, exp, nonce}`; exp default 10 min; single-use (nonce stored); verified by executor.
- Channels: Web, Discord. Discord interaction verifies approver in allowlist and role; callback maps to same internal API.
- Race safety: card state machine `PENDING -> APPROVED|DENIED|EXPIRED|CANCELLED -> CONSUMED`.

### 2.7 Executor
- One container per step from pinned image `chainedrisk/runner:1.0` (non-root, read-only rootfs, `--cap-drop ALL`, `no-new-privileges`, seccomp default, pids-limit 64, mem 128m, cpu 0.5, tmpfs /tmp, timeout 20s default).
- Network: attached only to `chained_lab` (`internal: true`, no gateway). Hostname resolution via embedded DNS; target allowlist enforced both in policy and via runner wrapper.
- Wrapper `runner-entry` receives action id + validated params (not shell), executes Python implementation, returns JSON result. No arbitrary shell.
- Kill switch: `POST /api/v1/kill` stops all `chained.run=true` containers and sets global lock.

### 2.8 Audit log
- Table `audit_events(id, ts, actor, type, payload_json, prev_hash, hash)`; `hash = sha256(prev_hash || canonical_json(event))`. Verify endpoint recomputes chain. Daily anchor optional.

### 2.9 Reporting
- Jinja2 -> Markdown/HTML; WeasyPrint -> PDF; SARIF 2.1.0 generator; JSON export.

## 3. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Performance | p95 API <300ms (non-job); graph render 2000 nodes <3s; correlate <60s |
| Scalability | Single node 50k findings; Neo4j adapter for larger |
| Reliability | Jobs resumable; DB migrations via Alembic |
| Security | OWASP ASVS L2 targets; CSRF/XSS protections; JWT (15 min) + refresh; RBAC (viewer, analyst, approver, admin) |
| Privacy | Evidence secrets redacted in UI by default (regex+entropy masking) |
| Observability | Structured JSON logs, Prometheus metrics at /metrics, trace ids |
| Compliance | Log retention configurable; exports include approvals |
| Config | 12-factor env vars |

## 4. Environment Variables
`CR_ENV, CR_SECRET_KEY, CR_APPROVAL_HMAC_KEY, CR_DB_URL, CR_GRAPH_BACKEND (networkx|neo4j), NEO4J_URI/USER/PASSWORD, ANTHROPIC_API_KEY, CR_LLM_MODEL, CR_LLM_ENABLED, DISCORD_BOT_TOKEN, DISCORD_APP_ID, DISCORD_PUBLIC_KEY, DISCORD_CHANNEL_ID, CR_APPROVER_DISCORD_IDS, CR_APPROVAL_TTL_SECONDS, CR_LAB_NETWORK, CR_RUNNER_IMAGE, CR_MAX_UPLOAD_MB`

## 5. Directory Structure (target repo)
```
chainedrisk/
  backend/app/{main.py,api/,core/,ingest/parsers/,graph/,chain/{rules/,engine.py,llm.py,validator.py,scoring.py},verify/{catalog.py,planner.py},policy/,approvals/,executor/,audit/,report/,models/}
  backend/tests/
  frontend/src/{pages/,components/,store/,api/}
  bot/discord_bot.py
  runner/{Dockerfile,runner_entry.py,actions/}
  lab/docker-compose.lab.yml
  seed/ docs/ schemas/
```

## 6. Key Algorithms (pseudocode)
```
def correlate(project):
    G = graph.load(project)
    cands = rule_engine.find_paths(G, start=attacker_cap, goals=CROWN_JEWELS, max_len=6)
    if llm_enabled: cands += llm.hypothesize(summarize(G))
    valid = [c for c in dedupe(cands) if validator.check(G, c)]
    for c in valid: c.score = scoring.score(c, G)
    ranked = sorted(valid, key=lambda c: -c.score)[:N]
    for c in ranked: c.explanation = llm.explain(c) or template.explain(c)
    return ranked

def execute(step):
    token = approvals.require(step)               # blocks unless L0
    assert approvals.verify(token, step.command_hash, step.target)
    assert policy.allow(step) and not state.kill_lock
    with sandbox.run(step) as r: stream(r)
    audit.log("EXECUTED", step, r.summary); approvals.consume(token)
```

## 7. Invariants (must be enforced and tested)
1. No active step executes without a valid, unexpired, single-use approval bound to the exact command hash.
2. LLM output never reaches a shell; only allowlisted action ids with schema-validated params.
3. Sandbox containers have no route outside `chained_lab`.
4. Every chain step maps to existing evidence.
5. Every state change is in the audit hash chain.
