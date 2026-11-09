# Demo Script & Pitch - ChainedRisk

## 1. One-liner
"ChainedRisk turns 300 ignorable alerts into 4 attack paths you can prove, and never runs a probe until a human sees exactly what it will do."

## 2. Judge Criteria Mapping
| Judge criterion | Where ChainedRisk shows it |
|---|---|
| Analyze information from multiple stages of an assessment | Recon (nmap/httpx) + Config (.git, headers, gitleaks) + Vuln (nuclei) ingested into one graph; stage coverage widget |
| Correlate information | Capability-unification chains; chain score vs individual severity; chain gain |
| Appropriate safety & human-approval controls | Approval Card with exact command, target, risk, blast radius; signed single-use tokens; policy engine; kill switch; isolated lab; audit chain |
| Technical depth | Hybrid rules+LLM with validator, min-cut remediation, hash-chained audit |
| Practical value | Fewer alerts, fix-one-break-many remediation, reports/SARIF |

## 3. Five-Minute Demo Flow
| Time | Action | Say |
|---|---|---|
| 0:00 | Overview page: "312 findings, 0 critical" | "Every tool says we're fine: Low, Medium, Medium." |
| 0:30 | Ingest screen: drop nmap, httpx, nuclei, gitleaks, headers; show 3 stage badges | "Three assessment stages, five tools, one graph." |
| 1:00 | Graph explorer: zoom to app.lab -> redis.lab | "Here's the shape the scanners can't see." |
| 1:30 | Click Correlate; chains appear; open #1 (score 91, gain +41) | "Exposed .git leaks the internal URL, SSRF pivots, Redis has no auth." |
| 2:15 | Show Rejected hypotheses tab | "The AI proposed 3 more; the validator dropped 2 as unsupported. Zero hallucinated steps reach you." |
| 2:45 | Generate plan; Run; Approval Card pops (UI + Discord phone) | "The agent is paused. Exact command, target container, blast radius, why." |
| 3:15 | Deny first card -> show nothing ran; then Approve the second | "Deny means deny: the executor can't run without a signed token." |
| 3:45 | Live console -> verdict Confirmed (reachability + no auth observed) | "Read-only, lab-only, reversible." |
| 4:15 | Remediation: "Fix SSRF + bind Redis -> breaks 4/4 chains"; simulate fix | "One afternoon of work, whole risk class gone." |
| 4:40 | Audit verify green; hit Kill demo | "Every decision is tamper-evident, and there's a big red stop." |

## 4. Wow Moments
1. Severity illusion graphic (Low/Med/Med -> Critical). 2. Approval card on a phone via Discord. 3. Rejected-hypotheses panel proving rigor. 4. Simulate fix collapses chains live.

## 5. Anticipated Q&A
- **Why not just CVSS/EPSS?** They score nodes; breaches are paths. We score paths and show the gain.
- **How do you prevent LLM hallucination?** LLM proposes, deterministic validator disposes; capabilities come from parsers/rules; hallucinated IDs rejected.
- **Is this an exploit tool?** No. Allowlisted read-only verification of reachability/missing auth in an isolated lab; L3 exploitation denied by design.
- **What stops the agent approving itself?** No code path issues tokens without an authenticated approver; tests assert it; separate-approver option.
- **Prompt injection from scanner output?** Evidence is data; output constrained to schema; action allowlist makes injected commands inert.
- **Does it work without the LLM?** Yes, rules-only mode is deterministic.
- **How is it different from BloodHound/attack-graph tools?** Multi-source ingestion of ordinary scanner output, AI hypothesis with validation, and built-in safe verification with HITL.
- **Scale?** Neo4j adapter, queue workers, Postgres; roadmap documented.

## 6. Slide Outline (8 slides)
1 Problem (alert fatigue, chains). 2 Insight (breaches are paths). 3 Solution overview diagram. 4 How it works (3 stages). 5 AI + validator. 6 HITL gate (card screenshot). 7 Results (precision/recall, 312->4). 8 Roadmap + ask.

## 7. Backup Plan
Pre-recorded video; screenshots; rules-only mode if LLM/network fails; seed data local; Discord optional (UI fallback).
