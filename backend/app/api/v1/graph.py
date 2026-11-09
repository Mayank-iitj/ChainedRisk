import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import Asset
from backend.app.graph.manager import graph_manager

router = APIRouter(tags=["graph"])

@router.get("/projects/{id}/assets")
def list_assets(
    id: str,
    zone: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.project_id == id)
    if zone:
        query = query.filter(Asset.zone == zone)
    if type:
        query = query.filter(Asset.type == type)

    assets = query.all()
    res = []
    for a in assets:
        res.append({
            "id": a.id,
            "project_id": a.project_id,
            "type": a.type,
            "name": a.name,
            "zone": a.zone,
            "props": json.loads(a.props_json or "{}")
        })
    return res

@router.get("/projects/{id}/graph")
def get_graph(
    id: str,
    depth: int = Query(2, ge=1, le=5),
    focus: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return graph_manager.export_cytoscape(project_id=id, db=db, focus_id=focus, depth=depth)

@router.get("/projects/{id}/graph/export")
def export_graph(
    id: str,
    format: str = Query("json", enum=["json", "cytoscape"]),
    db: Session = Depends(get_db)
):
    return graph_manager.export_cytoscape(project_id=id, db=db)

