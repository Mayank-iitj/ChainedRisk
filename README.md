# ChainedRisk
**Multi-Stage Attack Path Correlator with HITL Blast-Radius Gates**

Traditional scanners emit hundreds of isolated Low/Medium findings that teams ignore. Real breaches chain them:
`exposed .git` -> leaked credential/internal URL -> `SSRF` -> internal `unauthenticated Redis` -> RCE / data theft.

ChainedRisk ingests recon, config-analysis and vulnerability-scan output into a knowledge graph, correlates findings into
**evidence-backed multi-step attack paths**, and verifies them in a sandbox lab **only after a human approves a Blast Radius & Approval Card**.

## Document index
| File | Purpose |
|---|---|
| docs/PRD.md | Product requirements, personas, user stories, scope, metrics |
| docs/TRD.md | Technical requirements, stack, algorithms, NFRs |
| docs/SystemDesign.md | Architecture, components, sequence flows, deployment |
| docs/API.md | REST + WebSocket + Discord interaction contract |
| docs/DataModel.md | Graph schema, relational schema, capability taxonomy |
| docs/UIUX.md | Screens, flows, components, design tokens, accessibility |
| docs/Safety_HITL.md | Threat model, policy engine, approval protocol, sandbox hardening |
| docs/AI_Reasoning.md | Chain engine, LLM prompts, validation, scoring |
| docs/Testing.md | Test strategy, acceptance tests, evaluation dataset |
| docs/Deployment.md | Docker Compose, env vars, runbook |
| docs/Demo_and_Pitch.md | 5-minute demo script, judge criteria mapping, Q&A prep |
| docs/Roadmap.md | Phased plan (hackathon 48h + post-hackathon) |
| docs/Risks_and_Ethics.md | Risks, legal/ethical constraints, responsible use |
| schemas/*.json | JSON Schemas (finding, chain, approval card) |
| seed/demo_scenario.json | Demo dataset implementing the .git + SSRF + Redis chain |
| lab/docker-compose.lab.yml | Intentionally vulnerable isolated lab |

**Authorized use only.** Run against assets you own or have written permission to test. The lab is air-gapped by design.
# ChainedRisk
