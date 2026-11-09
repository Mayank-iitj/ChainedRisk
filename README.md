# ChainedRisk
**Multi-Stage Attack Path Correlator with Human-In-The-Loop Blast-Radius Gates**

Traditional scanners emit hundreds of isolated Low/Medium findings that security teams dismiss as noise. Real breaches chain them:
$$\text{Exposed .git} \longrightarrow \text{Internal URL Leak} \longrightarrow \text{SSRF Proxy Pivot} \longrightarrow \text{Unauthenticated Redis} \longrightarrow \text{Critical RCE}$$

ChainedRisk ingests recon, configuration analysis, and vulnerability scan output into a unified knowledge graph, correlates findings into **evidence-backed multi-step attack paths**, and verifies them in an isolated lab sandbox **only after a designated human reviews an immutable Blast Radius & Approval Card**.

---

## Key Features

1. **Deterministic Correlation & Capability Unification**:
   - Matches scanner findings using rigorous capability flow (`requires` $\to$ `provides`).
   - Geometric mean likelihood and composite impact scoring ($L = \prod p_i$, Score = $100 \times L \times I$).
   - Calculates **Chain Gain** ($S_{\text{chain}} - \max(S_{\text{isolated}})$), revealing the "Severity Illusion."

2. **Zero-Hallucination AI Invariants**:
   - Strictly enforces INV-1 through INV-12 via a deterministic graph validator.
   - Any LLM hypothesis citing invented findings or unsatisfied preconditions is rejected and audited.

3. **Human-In-The-Loop (HITL) Blast-Radius Gates**:
   - Deny-by-default execution policy.
   - Computes Blast Radius metrics (reachable hosts, synthetic datastores, network boundaries).
   - Generates cryptographically signed, single-use HMAC-SHA256 authorization tokens with nonces.
   - Strict separation of duty: proposer cannot approve.

4. **Hardened Lab Execution Sandbox**:
   - Probes execute exclusively inside an isolated Docker network (`chained_lab`, `10.77.0.0/24`) with no internet gateway.
   - Runner constraints: Non-root UID 10001, `--read-only` rootfs, `--cap-drop ALL`, CPU and memory limits.
   - Real-time output streaming over WebSockets.
   - Emergency kill switch for instantaneous lockdown.

5. **Graph-Theoretic Min-Cut Remediation**:
   - "Fix One, Break Many" — calculates the minimal set of controls that disconnects all attacker paths to crown jewels.
   - Real-time simulation of active attack path collapse.

6. **Tamper-Evident Cryptographic Audit Ledger**:
   - Append-only SHA-256 hash chain recording every ingestion, correlation, approval, and execution event.
   - 1-click verification of chain integrity.

7. **Dual Visual System & Interactive WebGL Components**:
   - **Dark Generated-Light Landing Page**: WebGL fragment shader with additive sine ribbons, 4 live 2D tile canvases, 72-bar severity illusion spectrum field, and prefers-reduced-motion compliance.
   - **React Bits High-Fidelity Interactive Suite**:
     - `<CrystalizedBall />`: Plasma containment chamber with 6 interactive field presets, electric rim strands, and dynamic particle flares.
     - `<HalftoneReveal />`: Cryptographic threat demasking plate with dual-plate CMYK/RGB screen angles and radial shockwave bursts.
     - `<ElasticMesh />`: Inflatable brand sculpture with balloon, chrome, jelly, and clay spring-mass physics simulation.
     - `<DitherVeil />`: Floyd-Steinberg error-diffusion telemetry curtain with cursor reveal window and kinetic click bursts.
   - **Modern Executive Dashboard**: Complete multi-stage breach path stepper, Cytoscape knowledge graph, console runner, and one-click Markdown & OASIS SARIF 2.1.0 exports.

---

## Quick Start

### 1. Local Python & Vite Setup

```bash
# Clone and install backend dependencies
pip install -r backend/requirements.txt

# Start backend API and static server (port 8000)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Open your browser to:
- **Landing Page**: `http://localhost:8000/`
- **Dashboard Console**: `http://localhost:8000/#app`

### 2. Frontend Development Server (Optional)

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### 3. Docker Compose Lab Setup

```bash
# 1. Start isolated target lab (Flask DMZ, Redis, Decoy Git)
docker compose -f lab/docker-compose.lab.yml up -d --build

# 2. Start ChainedRisk application stack
docker compose up -d --build
```

---

## Running the Automated Test Suite

```bash
python -m pytest backend/tests -v
```

Verifies:
- `test_invariants.py`: Invariants INV-1 through INV-12 (deterministic graph validation, HMAC tokens, nonces, separated approver checks, lab CIDR policy).
- `test_chain_engine.py`: Multi-stage candidate generation, capability unification, geometric scoring (91 score, +41 gain).
- `test_api.py`: Complete end-to-end user journey (ingestion, correlation, approval workflow, SARIF export).

---

## Architectural Documentation Index

| Document | Description |
|---|---|
| `docs/PRD.md` | Product requirements, user personas, acceptance criteria, metrics |
| `docs/TRD.md` | Technical stack, algorithms, non-functional requirements |
| `docs/SystemDesign.md` | High-level architecture, sequence diagrams, component topologies |
| `docs/API.md` | REST, WebSocket, and Discord bot API specifications |
| `docs/DataModel.md` | SQLAlchemy schemas, graph taxonomy, capability primitives |
| `docs/UIUX.md` | Visual tokens, interaction models, accessibility guidelines |
| `docs/Safety_HITL.md` | Threat model, policy engine, approval protocol, container isolation |
| `docs/AI_Reasoning.md` | Chain engine prompts, deterministic validation, scoring mechanics |
| `docs/Demo_and_Pitch.md` | 5-minute hackathon pitch script and evaluation criteria |

---

**Authorized Lab Use Only.** Designed exclusively for authorized security verification inside air-gapped test networks.
