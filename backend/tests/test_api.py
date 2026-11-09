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
    top_fix_id = remediations[0]["finding_id"]

    # 11. Simulate fix
    res = client.post("/api/v1/projects/prj_demo/simulate-fix", json=[top_fix_id])
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

def test_auth_registration_and_onboarding_workflow():
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_user = f"secops_{uid}"
    test_email = f"secops_{uid}@enterprise.corp"

    # 1. Register new user
    reg_res = client.post("/api/v1/auth/register", json={
        "username": test_user,
        "email": test_email,
        "password": "StrongPassword123!",
        "full_name": "Jordan Bell",
        "org_name": "Apex Cyber Labs",
        "title": "Principal Detection Engineer",
        "role": "analyst"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    user = reg_data["user"]
    assert user["onboarding_completed"] is False
    assert user["username"] == test_user

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check /me before onboarding
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["onboarding_completed"] is False

    # 3. Complete onboarding
    onboard_res = client.post("/api/v1/auth/onboarding", headers=headers, json={
        "org_name": "Apex Cyber Labs",
        "industry": "FinTech / High Frequency Trading",
        "environment": "AWS Multi-Account + EKS Staging",
        "risk_tolerance": "zero_tolerance",
        "project_name": "Apex Production Settlement Pipeline",
        "project_description": "Dedicated zero-trust assessment of settlement DMZ",
        "scope_cidrs": ["10.77.0.0/24"],
        "ingress_assets": [
            {
                "name": "apex-gateway.dmz",
                "ip": "10.77.0.10",
                "type": "Host",
                "zone": "dmz",
                "services": ["flask", "envoy"],
                "datastores": []
            }
        ],
        "crown_jewels": [
            {
                "name": "apex-settlement-redis.internal",
                "ip": "10.77.0.12",
                "type": "Host",
                "zone": "internal",
                "services": ["redis"],
                "datastores": ["ds_ledger_cache"]
            }
        ],
        "active_scanners": ["nmap", "gitleaks", "nuclei", "httpx"],
        "notification_channel": "discord",
        "seed_baseline_scenario": True
    })
    assert onboard_res.status_code == 200
    onboard_data = onboard_res.json()
    assert onboard_data["status"] == "completed"
    new_pid = onboard_data["project_id"]
    assert new_pid is not None

    # 4. Verify /me now reports onboarding_completed: True and active_project_id
    me_updated = client.get("/api/v1/auth/me", headers=headers)
    assert me_updated.status_code == 200
    assert me_updated.json()["onboarding_completed"] is True
    assert me_updated.json()["active_project_id"] == new_pid

    # 5. Verify stats on the new customized project
    stats_res = client.get(f"/api/v1/projects/{new_pid}/stats")
    assert stats_res.status_code == 200
    sdata = stats_res.json()
    assert sdata["findings"] > 0
    assert sdata["chains"] >= 1
    assert len(sdata["target_assets"]) > 0
