# Data Model - ChainedRisk

## 1. Graph Schema
### Nodes
| Label | Key properties |
|---|---|
| Domain | id, name |
| Host | id, ip, hostname, zone (external\|dmz\|internal\|lab), os |
| Service | id, host_id, port, proto, product, version, auth (none\|basic\|token\|unknown) |
| Endpoint | id, url, method, params, auth_required |
| Container | id, name, image, network |
| DataStore | id, kind (cache\|db\|repo\|bucket), sensitivity (synthetic\|low\|medium\|high) |
| Credential | id, kind, scope, redacted_preview |
| Finding | id, title, severity, stage, source_tool, rule_id, confidence, evidence_ref |
| Capability | id (token), description |

### Edges
| Type | From -> To | Props |
|---|---|---|
| RESOLVES_TO | Domain -> Host | |
| RUNS | Host -> Service | |
| EXPOSES | Service -> Endpoint | |
| HAS_FINDING | Asset -> Finding | |
| GRANTS | Finding -> Capability | confidence |
| REQUIRES | Finding -> Capability | |
| CAN_REACH | Asset -> Asset | zone_rule, derived (bool), via_finding |
| STORES | Service/Host -> DataStore | |
| AUTHENTICATES_TO | Credential -> Service | |
| MEMBER_OF | Host -> Network | |

Derived edges: when `net_pivot_internal` capability is held through an SSRF endpoint, a `CAN_REACH` edge (derived=true, via_finding=SSRF) is added from the SSRF host to every internal service reachable from that host's network.

## 2. Capability Taxonomy (tokens)
| Token | Meaning |
|---|---|
| attacker_external | Starting position: unauthenticated external actor |
| recon_info | Host/port/tech information |
| internal_url_disclosure | Knows internal hostnames/URLs |
| source_repo_access | Can read application source/repo metadata |
| credential_disclosure | Holds a credential/secret |
| auth_bypass | Can act without valid auth on target |
| net_pivot_internal | Can make requests from inside the trust boundary |
| internal_service_access | Can talk to an internal service |
| data_read | Read data from a store |
| data_exfil | Move data out |
| data_write | Modify data |
| code_exec_possible | Likely code execution path (e.g. Redis config write, deserialization) |
| rce | Confirmed remote code execution |
| priv_esc | Higher privileges |
| lateral_movement | Access to another host |
| dos | Availability impact |

Impact weights: rce 1.0, data_exfil 0.9, credential_disclosure 0.8, data_write 0.8, priv_esc 0.8, code_exec_possible 0.7, data_read 0.6, dos 0.4, internal_url_disclosure 0.2, recon_info 0.1.

## 3. Relational Schema (SQLite/Postgres)
```sql
CREATE TABLE users(id TEXT PRIMARY KEY, username TEXT UNIQUE, pw_hash TEXT, role TEXT CHECK(role IN('viewer','analyst','approver','admin')), discord_id TEXT);
CREATE TABLE projects(id TEXT PRIMARY KEY, name TEXT, description TEXT, scope_json TEXT, created_by TEXT, created_at TEXT);
CREATE TABLE assets(id TEXT PRIMARY KEY, project_id TEXT, type TEXT, name TEXT, props_json TEXT, zone TEXT, UNIQUE(project_id,type,name));
CREATE TABLE findings(id TEXT PRIMARY KEY, project_id TEXT, asset_id TEXT, title TEXT, stage TEXT, severity TEXT, cvss REAL,
  source_tool TEXT, rule_id TEXT, evidence_json TEXT, provides_json TEXT, requires_json TEXT, cwe_json TEXT, attack_json TEXT,
  dedup_key TEXT UNIQUE, confidence REAL, first_seen TEXT);
CREATE TABLE edges(id TEXT PRIMARY KEY, project_id TEXT, src TEXT, dst TEXT, type TEXT, props_json TEXT, derived INTEGER DEFAULT 0);
CREATE TABLE chains(id TEXT PRIMARY KEY, project_id TEXT, title TEXT, score INTEGER, severity TEXT, likelihood REAL, impact REAL,
  chain_gain INTEGER, origin TEXT, confidence REAL, status TEXT, explanation TEXT, validation_json TEXT, created_at TEXT);
CREATE TABLE chain_steps(id TEXT PRIMARY KEY, chain_id TEXT, ord INTEGER, finding_ids_json TEXT, requires_json TEXT, provides_json TEXT, narrative TEXT, evidence_refs_json TEXT);
CREATE TABLE rejected_hypotheses(id TEXT PRIMARY KEY, project_id TEXT, payload_json TEXT, reason TEXT, created_at TEXT);
CREATE TABLE verification_plans(id TEXT PRIMARY KEY, chain_id TEXT, created_at TEXT);
CREATE TABLE verification_steps(id TEXT PRIMARY KEY, plan_id TEXT, ord INTEGER, action TEXT, params_json TEXT, target_asset TEXT,
  risk_level TEXT, reversible INTEGER, command_preview TEXT, command_hash TEXT, blast_json TEXT, status TEXT);
CREATE TABLE approval_cards(id TEXT PRIMARY KEY, step_id TEXT, status TEXT, card_json TEXT, created_at TEXT, expires_at TEXT, discord_message_id TEXT);
CREATE TABLE approvals(id TEXT PRIMARY KEY, card_id TEXT, decision TEXT, approver TEXT, justification TEXT, nonce TEXT UNIQUE, consumed INTEGER DEFAULT 0, decided_at TEXT);
CREATE TABLE executions(id TEXT PRIMARY KEY, step_id TEXT, approval_id TEXT, container_id TEXT, status TEXT, verdict TEXT, exit_code INTEGER, started_at TEXT, ended_at TEXT);
CREATE TABLE evidence(id TEXT PRIMARY KEY, project_id TEXT, kind TEXT, sha256 TEXT, path TEXT, redacted INTEGER, created_at TEXT);
CREATE TABLE audit_events(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, actor TEXT, type TEXT, payload_json TEXT, prev_hash TEXT, hash TEXT);
CREATE INDEX idx_findings_project ON findings(project_id, severity);
CREATE INDEX idx_edges_src ON edges(project_id, src); CREATE INDEX idx_edges_dst ON edges(project_id, dst);
```

## 4. Chaining Rule Format (YAML)
```yaml
- id: R-GIT-SSRF-REDIS
  name: Source leak to SSRF to unauthenticated Redis
  match:
    - finding: {rule_id_any: [git-config-exposure, git-head-exposure]}   # step 1
      provides: [internal_url_disclosure]
    - finding: {tags_any: [ssrf]}                                         # step 2
      requires: [internal_url_disclosure]
      provides: [net_pivot_internal]
    - finding: {rule_id_any: [redis-unauth], service: redis}              # step 3
      requires: [net_pivot_internal]
      provides: [data_exfil, code_exec_possible]
  reachability: ssrf_host -> redis_service
  mitre: [T1592, T1190, T1210]
  base_likelihood: [0.9, 0.7, 0.9]
  remediation_hint: "Block internal ranges in fetch proxy; require Redis auth/bind to localhost; deny /.git at web server."
```
Starter rule library (MVP): git leak -> SSRF -> Redis; env/config leak -> credential reuse -> admin panel; open S3-like bucket -> source -> secret -> DB; weak headers (no CSP) + reflected XSS + session cookie w/o HttpOnly -> session theft; default creds on admin panel -> file upload -> RCE; metadata endpoint reachable via SSRF -> cloud creds.

## 5. Unified Finding JSON Schema
See `schemas/finding.schema.json`, `schemas/chain.schema.json`, `schemas/approval_card.schema.json`.

## 6. Sensitive Data Handling
Secrets in evidence masked by regex (AWS keys, JWT, private keys, password= patterns) + Shannon entropy > 4.0 on tokens >=20 chars; raw values only in evidence store with restricted role; masked previews `AKIA****...XYZ`.
