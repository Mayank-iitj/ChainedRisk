import pytest
import json
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db.session import Base
from backend.app.models.db_models import Project, Chain, Finding
from backend.app.ingest.normalizer import process_ingest
from backend.app.chain.engine import chain_engine

SEED_PATH = Path(__file__).resolve().parents[2] / "seed" / "demo_scenario.json"

@pytest.fixture
def populated_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    project = Project(
        id="prj_demo",
        name="Correlated Assessment Lab",
        scope_json=json.dumps({"cidrs": ["10.77.0.0/24"], "lab_only": True})
    )
    db.add(project)
    db.commit()

    with open(SEED_PATH, "rb") as f:
        content = f.read()

    process_ingest(
        db=db,
        project_id="prj_demo",
        file_bytes=content,
        source_tool="native",
        filename="demo_scenario.json",
        actor="system"
    )

    yield db
    db.close()

def test_demo_scenario_correlation(populated_db):
    findings_count = populated_db.query(Finding).filter(Finding.project_id == "prj_demo").count()
    assert findings_count >= 3

    # Correlate
    chains = chain_engine.correlate(project_id="prj_demo", db=populated_db, use_llm=False)
    assert len(chains) >= 1

    top_chain = chains[0]
    # Check score and severity
    assert top_chain["score"] >= 85
    assert top_chain["severity"] == "critical"
    # Check chain gain vs individual findings
    assert top_chain["chain_gain"] >= 35

    # Check steps
    steps = top_chain["steps"]
    assert len(steps) == 3

    # Step 1: git
    assert any("git" in fid.lower() for fid in steps[0]["finding_ids"])
    # Step 2: ssrf
    assert any("ssrf" in fid.lower() for fid in steps[1]["finding_ids"])
    # Step 3: redis
    assert any("redis" in fid.lower() for fid in steps[2]["finding_ids"])
