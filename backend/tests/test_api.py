import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_full_journey():
    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200

    # 2. Login
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Load demo seed scenario
    res = client.post("/api/v1/seed/load-demo?project_id=prj_demo")
    assert res.status_code == 200
    r = res.json()["result"]
    assert r["findings_created"] + r["duplicates"] >= 3

    # 4. Correlate attack paths
    res = client.post("/api/v1/projects/prj_demo/correlate", json={"mode": "rule", "use_llm": False})
    assert res.status_code == 200
    chains = res.json()["chains"]
    assert len(chains) >= 1

    top_chain = chains[0]
    chain_id = top_chain["id"]
    assert top_chain["score"] >= 85
    assert top_chain["severity"] == "critical"

    # 5. Graph export
    res = client.get("/api/v1/projects/prj_demo/graph")
    assert res.status_code == 200
    graph = res.json()
    assert len(graph["nodes"]) > 0

    # 6. Plan verification
    res = client.post(f"/api/v1/chains/{chain_id}/plan")
    assert res.status_code == 200
    plan_id = res.json()["plan_id"]
    assert len(res.json()["steps"]) >= 2

    # 7. Run plan -> triggers HITL gate
    res = client.post(f"/api/v1/plans/{plan_id}/run")
    assert res.status_code == 200
    assert res.json()["status"] == "approval_required"
    card = res.json()["card"]
    card_id = card["id"]
    step_id = card["step_id"]

    # 8. Approve card
    res = client.post(f"/api/v1/approvals/{card_id}/approve", json={"justification": "Authorized test verification"})
    assert res.status_code == 200
    approval_token = res.json()["token"]
    assert approval_token is not None

    # 9. Execute step with signed token
    res = client.post(f"/api/v1/executions/run-step?step_id={step_id}&token={approval_token}")
    assert res.status_code == 200
    assert res.json()["verdict"] == "confirmed"

    # 10. Remediation Min-cut
    res = client.get("/api/v1/projects/prj_demo/remediation")
    assert res.status_code == 200
    remediations = res.json()
    assert len(remediations) > 0

    # 11. Simulate fix
    res = client.post("/api/v1/projects/prj_demo/simulate-fix", json=["fnd_ssrf"])
    assert res.status_code == 200
    assert res.json()["chains_collapsed"] >= 1

    # 12. Verify Audit Chain
    res = client.get("/api/v1/audit/verify")
    assert res.status_code == 200
    assert res.json()["valid"] is True
    assert res.json()["events"] > 0

    # 13. Reports export
    res = client.post("/api/v1/projects/prj_demo/reports?format=sarif")
    assert res.status_code == 200
    assert res.json()["version"] == "2.1.0"

    res = client.post("/api/v1/projects/prj_demo/reports?format=md")
    assert res.status_code == 200
    assert "Executive Security Assessment Report" in res.json()["content"]
