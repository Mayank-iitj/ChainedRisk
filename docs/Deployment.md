# Deployment & Runbook - ChainedRisk

## 1. Prerequisites
Docker 24+, Docker Compose v2, 4 GB RAM, ports 5173/8000 free. Optional: Anthropic API key, Discord application + bot.

## 2. Quick Start
```bash
git clone <repo> && cd chainedrisk
cp .env.example .env            # fill CR_SECRET_KEY, CR_APPROVAL_HMAC_KEY (32+ random bytes), ANTHROPIC_API_KEY (optional)
docker compose -f lab/docker-compose.lab.yml up -d      # isolated vulnerable lab
docker compose up -d --build                             # api, frontend, bot
open http://localhost:5173    # login admin / generated password in logs
# click "Load demo scenario" or POST /api/v1/projects/{id}/ingest with seed files
```

## 3. Compose Layout (app)
Services: `api` (FastAPI), `frontend` (Vite/nginx), `bot` (discord), `docker-proxy` (tecnativa/docker-socket-proxy with CONTAINERS=1, NETWORKS=1, POST=1, others 0), optional `neo4j`. Networks: `chained_app` (bridge) and external `chained_lab` (internal).

## 4. Environment (.env.example)
```
CR_ENV=dev
CR_SECRET_KEY=change-me
CR_APPROVAL_HMAC_KEY=change-me-32-bytes-min
CR_DB_URL=sqlite:////data/chainedrisk.db
CR_GRAPH_BACKEND=networkx
CR_LLM_ENABLED=true
ANTHROPIC_API_KEY=
CR_LLM_MODEL=claude-sonnet-4-5
CR_APPROVAL_TTL_SECONDS=600
CR_REQUIRE_SEPARATE_APPROVER=false
CR_LAB_NETWORK=chained_lab
CR_LAB_CIDR=10.77.0.0/24
CR_RUNNER_IMAGE=chainedrisk/runner:1.0
DISCORD_BOT_TOKEN=
DISCORD_APP_ID=
DISCORD_PUBLIC_KEY=
DISCORD_CHANNEL_ID=
CR_APPROVER_DISCORD_IDS=
CR_MAX_UPLOAD_MB=200
```
Set `CR_LLM_MODEL` to whichever model your account provides.

## 5. Discord Setup
1. Developer Portal -> New Application -> Bot -> copy token. 2. General Info -> copy Application ID and Public Key. 3. Set Interactions Endpoint URL to `https://<public-host>/api/v1/integrations/discord/interactions` (use a tunnel for demos). 4. Invite bot with scopes `bot applications.commands`, permissions: Send Messages, Embed Links, Use Slash Commands. 5. Put approver Discord IDs in `CR_APPROVER_DISCORD_IDS`.

## 6. Lab Reset
`docker compose -f lab/docker-compose.lab.yml down -v && docker compose -f lab/docker-compose.lab.yml up -d`

## 7. Backups & Maintenance
Backup `/data` (SQLite + evidence) nightly; `GET /audit/verify` weekly; rotate HMAC key (invalidates pending approvals); Alembic `upgrade head` on deploy.

## 8. Troubleshooting
| Symptom | Fix |
|---|---|
| Approval cards not appearing in Discord | Check bot token, channel id, interactions URL reachable; UI still works |
| Runner cannot reach lab | Confirm network `chained_lab` exists and `api` can attach containers; check docker-proxy perms |
| LLM chains empty | Check API key; UI shows rules-only banner; verify rule coverage |
| 423 Locked | Kill switch active; admin unlock with reason |
| Graph slow | Reduce depth, enable severity filter, use Neo4j |

## 9. CI/CD (GitHub Actions)
Jobs: lint (ruff, eslint), unit, invariants, build images, trivy scan, e2e (compose), publish. Branch protection on invariants job.

## 10. Production Hardening Notes
TLS reverse proxy, SSO/OIDC, Postgres, secrets manager, gVisor/Kata runtime for runner, separate approver policy on, log shipping, network policies.
