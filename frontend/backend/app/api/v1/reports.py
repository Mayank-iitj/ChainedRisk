from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.report.generator import generate_markdown_report, generate_sarif_report

router = APIRouter(tags=["reports"])

@router.post("/projects/{id}/reports")
def generate_report(id: str, format: str = "md", db: Session = Depends(get_db)):
    if format == "sarif":
        sarif_data = generate_sarif_report(project_id=id, db=db)
        return sarif_data
    elif format == "md":
        md_text = generate_markdown_report(project_id=id, db=db)
        return {"format": "md", "content": md_text}
    else:
        return {"format": "json", "report": generate_sarif_report(project_id=id, db=db)}

@router.get("/projects/{id}/reports/download")
def download_report(id: str, format: str = "md", db: Session = Depends(get_db)):
    if format == "sarif":
        sarif_data = generate_sarif_report(project_id=id, db=db)
        import json
        return Response(
            content=json.dumps(sarif_data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=chainedrisk_{id}.sarif"}
        )
    else:
        md_text = generate_markdown_report(project_id=id, db=db)
        return Response(
            content=md_text,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=chainedrisk_{id}.md"}
        )

