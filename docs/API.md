# API Specification - ChainedRisk
Base URL: `/api/v1` | Format: JSON | Auth: `Authorization: Bearer <JWT>` | Realtime: `/ws`

## 1. Conventions
- Timestamps ISO-8601 UTC. IDs are prefixed ULIDs (`prj_`, `fnd_`, `ast_`, `chn_`, `stp_`, `crd_`, `exe_`).
- Pagination: `?limit=50&cursor=...` -> `{items:[], next_cursor}`.
- Errors: `{ "error": { "code": "string", "message": "string", "details": {}, "trace_id": "string" } }`
- Idempotency: `Idempotency-Key` header supported on POST ingest/correlate.
- Roles: `viewer` (read), `analyst` (ingest, correlate, plan), `approver` (approve/deny), `admin` (users, kill-reset, policy).

| HTTP | Meaning |
|---|---|
| 200/201/202 | OK / Created / Accepted (async job) |
| 400 | Validation error |
| 401/403 | Auth / role |
| 404 | Not found |
| 409 | State conflict (e.g. card already decided) |
| 410 | Approval expired |
| 423 | System locked (kill switch active) |
| 429 | Rate limited |

## 2. Auth
| Method | Path | Body | Response |
|---|---|---|---|
| POST | /auth/login | `{username,password}` | `{access_token, refresh_token, expires_in, user}` |
| POST | /auth/refresh | `{refresh_token}` | `{access_token}` |
| GET | /auth/me | - | `{id,username,role,discord_id}` |

## 3. Projects
| Method | Path | Description |
|---|---|---|
| POST | /projects | Create `{name, description, scope:{cidrs:[],domains:[],lab_only:true}}` |
| GET | /projects | List |
| GET | /projects/{id} | Detail + stats |
| DELETE | /projects/{id} | Delete (admin) |
| GET | /projects/{id}/stats | `{assets, findings, by_severity, by_stage, chains, pending_approvals}` |

## 4. Ingestion
**POST /projects/{id}/ingest** (multipart) fields: `files[]`, `source_tool` (auto|nmap|nuclei|httpx|gitleaks|headers|zap|subfinder|csv), `stage` (auto|recon|config|vuln)
202 response:
```json
{ "job_id": "job_01H...", "status": "queued" }
```
**GET /jobs/{job_id}** ->
```json
{ "id":"job_01H","type":"ingest","status":"done","progress":100,
  "result":{"files":3,"assets_created":41,"findings_created":312,"duplicates":18,"errors":[]} }
```
**POST /projects/{id}/findings** manual finding (analyst)
```json
{ "title":"Exposed .git directory","stage":"config","severity":"low","asset_id":"ast_...",
  "rule_id":"git-exposure","evidence":"GET /.git/config 200","tags":["info_disclosure"] }
```
**GET /projects/{id}/findings?stage=&severity=&asset_id=&q=&limit=&cursor=**
Finding object:
```json
{ "id":"fnd_01H","project_id":"prj_01H","title":"Exposed .git/config","stage":"config","severity":"low",
  "cvss":5.3,"source_tool":"nuclei","rule_id":"git-config-exposure","asset_id":"ast_app",
  "evidence":{"request":"GET /.git/config","response_snippet":"[core]...url = http://git.lab/app.git","digest":"sha256:..."},
  "provides":["internal_url_disclosure","source_repo_access"],"requires":[],"cwe":["CWE-538"],
  "attack":["T1592","T1213"],"first_seen":"2026-11-08T10:00:00Z" }
```

## 5. Assets & Graph
| Method | Path | Description |
|---|---|---|
| GET | /projects/{id}/assets | Filter by type/zone |
| GET | /projects/{id}/graph | `?depth=&focus=ast_..&severity_min=` -> Cytoscape-style `{nodes:[{data:{id,type,label,severity}}],edges:[{data:{id,source,target,type,derived}}]}` |
| GET | /projects/{id}/graph/export?format=json\|graphml | Export |

## 6. Correlation (chains)
**POST /projects/{id}/correlate**
```json
{ "mode":"hybrid", "max_chain_length":6, "top_n":20, "use_llm":true, "crown_jewels":["ast_redis"] }
```
202 -> `{ "job_id":"job_...", "status":"running" }`

**GET /projects/{id}/chains?min_score=&status=&limit=** and **GET /chains/{chain_id}**
Chain object:
```json
{
 "id":"chn_01H","project_id":"prj_01H","title":"Source leak -> SSRF -> unauthenticated Redis -> RCE",
 "score":91,"severity":"critical","likelihood":0.62,"impact":1.0,
 "max_individual_severity":"medium","chain_gain":47,"origin":"rule+llm","confidence":0.86,
 "status":"hypothesis",
 "mitre":["T1592","T1190","T1210","T1059"],
 "steps":[
  {"id":"stp_1","order":1,"finding_ids":["fnd_git"],"requires":["attacker_external"],"provides":["internal_url_disclosure"],
   "narrative":"Exposed .git/config reveals internal host git.lab and the internal app URL.","evidence_refs":["ev_1"]},
  {"id":"stp_2","order":2,"finding_ids":["fnd_ssrf"],"requires":["internal_url_disclosure"],"provides":["net_pivot_internal"],
   "narrative":"/fetch?u= endpoint performs server-side requests to internal hosts.","evidence_refs":["ev_2"]},
  {"id":"stp_3","order":3,"finding_ids":["fnd_redis"],"requires":["net_pivot_internal"],"provides":["data_exfil","rce_possible"],
   "narrative":"Redis on 6379 has no auth; reachable via SSRF.","evidence_refs":["ev_3"]}
 ],
 "explanation":"...", "remediation":[{"finding_id":"fnd_ssrf","action":"Block internal ranges in fetch proxy","breaks_chains":4}],
 "validation":{"passed":true,"checks":["evidence_exists","preconditions_satisfied","reachability"],"rejected_reason":null}
}
```
Chain status: `hypothesis | planned | verifying | confirmed | not_reproduced | blocked | dismissed`.
| Method | Path | Description |
|---|---|---|
| POST | /chains/{id}/dismiss | `{reason}` |
| GET | /projects/{id}/remediation | Min-cut plan `[{finding_id, breaks_chains:[...], effort}]` |
| GET | /chains/{id}/rejections | Rejected LLM hypotheses (transparency) |

## 7. Verification Planning
**POST /chains/{id}/plan** -> creates VerificationPlan
```json
{ "plan_id":"pln_01H","chain_id":"chn_01H","steps":[
  {"id":"vst_1","action":"git_exposure_check","params":{"url":"http://app.lab:8080/.git/config"},
   "target":"ast_app","risk_level":"L1","reversible":true,
   "command_preview":"git_exposure_check --url http://app.lab:8080/.git/config",
   "command_hash":"sha256:ab12...","approval_required":true,"blast_radius":{"score":12,"reachable_assets":["ast_app"],"state_change":"none"}} ] }
```
**GET /actions** -> allowlisted action catalog with param schemas, risk, side effects.
**POST /plans/{id}/run** -> `{mode:"step"|"all"}` starts the agent; each gated step creates an Approval Card and pauses. Response 202 `{execution_group_id}`.

## 8. Approvals (HITL)
Approval Card object:
```json
{ "id":"crd_01H","step_id":"vst_2","chain_id":"chn_01H","status":"pending",
  "title":"Verify SSRF -> Redis pivot (Step 2/3)",
  "command":"ssrf_canary_probe --url http://app.lab:8080/fetch?u=http://redis.lab:6379/ --expect reachable",
  "command_hash":"sha256:cd34...","target":{"asset_id":"ast_redis","container":"redis-lab","ip":"10.77.0.12"},
  "risk_level":"L1","blast_radius":{"score":28,"reachable_assets":["ast_app","ast_redis"],"datastores":[{"id":"ds_cache","sensitivity":"synthetic"}],
    "credentials_in_scope":0,"state_change":"none","network_scope":"lab-only"},
  "reason":"F-12 provides net_pivot_internal; F-17 requires it.","rollback":"none required","timeout_s":20,
  "created_at":"...","expires_at":"...","requested_by":"agent","discord_message_id":"..." }
```
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /approvals?status=pending | viewer | List cards |
| GET | /approvals/{id} | viewer | Detail |
| POST | /approvals/{id}/approve | approver | Body `{justification?:string, narrow?:{timeout_s?, params_override?}}` -> `{token_id, status:"approved"}`; 409 if decided, 410 if expired |
| POST | /approvals/{id}/deny | approver | `{reason}` |
| POST | /approvals/{id}/cancel | analyst | Cancel pending |
Rules: narrowing may only reduce scope (shorter timeout, fewer params); any param change regenerates `command_hash` and re-renders the card for confirmation. Approver cannot be the requester if `CR_REQUIRE_SEPARATE_APPROVER=true`.

## 9. Executions
| Method | Path | Description |
|---|---|---|
| GET | /executions/{id} | `{status, verdict, started_at, ended_at, exit_code, evidence_ids}` |
| GET | /executions/{id}/logs | Redacted log text |
| POST | /kill | admin/approver: global kill switch -> `{stopped_containers:n, cancelled_cards:m, locked:true}` |
| POST | /kill/reset | admin only |
Verdicts: `confirmed`, `not_reproduced`, `blocked_by_policy`, `error`, `timeout`.

## 10. Reports & Audit
| Method | Path | Description |
|---|---|---|
| POST | /projects/{id}/reports | `{format:"md"|"pdf"|"json"|"sarif", include:["chains","evidence","approvals","audit"]}` -> job |
| GET | /reports/{id}/download | File |
| GET | /audit?type=&actor=&from=&to= | Events |
| GET | /audit/verify | `{valid:true, events:1423, head_hash:"..."}` |

## 11. Policy & Config (admin)
`GET/PUT /policy` (YAML as JSON), `GET /config/public` (feature flags, LLM on/off, lab-only flag).

## 12. WebSocket `/ws?token=...`
Client subscribes: `{"op":"subscribe","project_id":"prj_..."}`. Server events:
| type | payload |
|---|---|
| `job.progress` | `{job_id, progress, message}` |
| `job.done` | `{job_id, result}` |
| `chain.created` / `chain.updated` | `{chain}` |
| `approval.requested` | `{card}` |
| `approval.decided` | `{card_id, status, approver}` |
| `execution.started/log/finished` | `{execution_id, line?, verdict?}` |
| `system.locked` | `{reason}` |

## 13. Discord Integration
- Bot posts embed to `DISCORD_CHANNEL_ID` on `approval.requested`: fields Command, Target, Risk, Blast Radius, Why, Expires; components: buttons `Approve` (green), `Deny` (red), `Details` (link to UI).
- Interaction endpoint `POST /integrations/discord/interactions` verifies Ed25519 signature (`X-Signature-Ed25519`, `X-Signature-Timestamp`) using `DISCORD_PUBLIC_KEY`; maps Discord user id -> approver via allowlist; calls internal approve/deny; edits message to show decision and disables buttons.
- Commands: `/chained status`, `/chained pending`, `/chained kill`.
- Approve via Discord requires a confirm modal for L2 (justification text).

## 14. Approval Token (internal)
`token = b64url(json{card_id,step_id,command_hash,target,approver,exp,nonce}) + "." + b64url(HMAC_SHA256(key,payload))`. Executor `verify()` checks signature, exp, hash equality with recomputed step hash, nonce unused, kill lock off. Not exposed to clients.

## 15. Rate Limits
Auth 10/min; ingest 5/min; correlate 3/min; approvals 60/min per user.

## 16. Example cURL
```bash
curl -H "Authorization: Bearer $T" -F "files=@nuclei.jsonl" -F source_tool=nuclei $H/api/v1/projects/prj_1/ingest
curl -X POST -H "Authorization: Bearer $T" -d '{"mode":"hybrid","use_llm":true}' $H/api/v1/projects/prj_1/correlate
curl -X POST -H "Authorization: Bearer $T" $H/api/v1/approvals/crd_1/approve -d '{"justification":"lab only, read-only"}'
```
