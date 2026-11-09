import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.db_models import Asset
from backend.app.graph.manager import graph_manager

router = APIRouter(tags=["graph"])

from pydantic import BaseModel

class AssetCreateRequest(BaseModel):
    name: str
    type: str = "Host"
    zone: str = "internal"
    ip: Optional[str] = "10.77.0.x"
    services: Optional[List[Dict[str, Any]]] = None
    datastores: Optional[List[str]] = None
    tags: Optional[List[str]] = None

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

@router.post("/projects/{id}/assets")
def create_asset(
    id: str,
    req: AssetCreateRequest,
    db: Session = Depends(get_db)
):
    import uuid
    asset_id = f"ast_{uuid.uuid4().hex[:8]}"
    props = {
        "ip": req.ip or "10.77.0.x",
        "services": req.services or [],
        "datastores": req.datastores or [],
        "tags": req.tags or []
    }
    asset = Asset(
        id=asset_id,
        project_id=id,
        name=req.name,
        type=req.type,
        zone=req.zone,
        props_json=json.dumps(props)
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    # Register in graph manager
    try:
        graph_manager.add_asset_node(id, asset_id, asset.name, asset.type, asset.zone)
    except Exception:
        pass

    return {
        "id": asset.id,
        "project_id": asset.project_id,
        "type": asset.type,
        "name": asset.name,
        "zone": asset.zone,
        "props": props
    }

@router.delete("/projects/{id}/assets/{asset_id}")
def delete_asset(
    id: str,
    asset_id: str,
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.project_id == id, Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"status": "deleted", "id": asset_id}


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

