# Risks & Ethics - ChainedRisk

## Project Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM latency/outage during demo | Med | Med | Rules-only fallback; cached results; recorded demo |
| Parser edge cases | High | Low | Golden tests; permissive parse with warnings |
| Docker/network issues on demo machine | Med | High | Pre-pull images; script `make demo`; video backup |
| Scope creep | High | Med | MVP cut list in Roadmap |
| False-positive chains | Med | Med | Validator, confidence display, "not verified" labels |
| Approval fatigue | Med | Med | Batching, concise cards, risk ordering |

## Ethical & Legal Guidelines
- Authorized targets only; shipped lab is synthetic and isolated.
- Tool is defensive: verifies exposure, does not weaponize or persist; destructive actions are not implemented.
- Transparent AI: show evidence, confidence, rejected hypotheses; label "hypothesis" vs "confirmed".
- Privacy: secrets redacted; data stays local; LLM receives summarized/redacted graph (no raw secrets); option to disable LLM.
- Human accountability: named approver recorded for every active step.
- Dual-use: no exploit payload library, no evasion features, rate limits, scope enforcement.
- Licensing: dependencies under permissive licenses (verify before release); rules authored originally; nuclei templates not redistributed.

## Limitations (state openly)
Verification demonstrates preconditions (reachability, missing auth), not full exploitation; chain quality depends on scanner coverage; derived reachability is a model, not a guarantee.
