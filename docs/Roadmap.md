# Roadmap - ChainedRisk

## Hackathon Plan (48 hours)
| Block | Hours | Deliverables |
|---|---|---|
| H0-4 | 4 | Repo scaffold, compose, DB, auth stub, lab up, seed data |
| H4-10 | 6 | Parsers (nmap, nuclei, httpx, gitleaks, headers), normalizer, graph service |
| H10-18 | 8 | Rule engine + 6 rules, validator, scoring, chains API |
| H18-24 | 6 | LLM hypothesis node + explanation + rejected list |
| H24-32 | 8 | Verification planner, actions, policy engine, approval service + tokens |
| H32-38 | 6 | Executor + sandbox, kill switch, audit chain |
| H38-44 | 6 | Frontend: overview, graph, chains, approval card, console; Discord bot |
| H44-48 | 4 | Tests of invariants, demo rehearsal, video, slides |
Cut order if behind: Neo4j, PDF/SARIF, min-cut simulate, Discord (keep web), extra parsers.

## Milestones after the hackathon
| Phase | Scope |
|---|---|
| V1 (4-6 wks) | Neo4j adapter, RBAC/SSO, SARIF, Postgres, Jira/GitHub issue export, more parsers (Burp, Trivy, Prowler), scheduler, diff between scans |
| V2 (2-3 mo) | Cloud/IAM graph (AWS/GCP), Kubernetes attack paths, detection-rule export (Sigma), multi-tenant, approval policies per team |
| V3 | Continuous assessment, risk trending, purple-team replay, local LLM option, gVisor/Kata runners |

## Definition of Done (MVP)
All INV tests pass; demo scenario yields ranked chain #1; approval flow works in UI (and Discord if configured); audit verifies; docs complete; `docker compose up` works from clean clone.

## Team Roles (suggested)
Backend/graph & chain engine; Security/policy/executor; Frontend/UX; AI/prompts/eval; PM/demo.
