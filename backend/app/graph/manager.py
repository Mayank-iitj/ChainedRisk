import json
from typing import Dict, Any, List, Set, Optional
import networkx as nx
from sqlalchemy.orm import Session
from backend.app.models.db_models import Asset, Finding, Edge

class GraphManager:
    def __init__(self):
        self._graphs: Dict[str, nx.DiGraph] = {}

    def get_graph(self, project_id: str, db: Session) -> nx.DiGraph:
        G = nx.DiGraph()

        # Load assets
        assets = db.query(Asset).filter(Asset.project_id == project_id).all()
        for a in assets:
            props = json.loads(a.props_json or "{}")
            G.add_node(
                a.id,
                node_type=a.type,
                label=a.name,
                zone=a.zone,
                severity="info",
                props=props
            )

        # Load findings
        findings = db.query(Finding).filter(Finding.project_id == project_id).all()
        for f in findings:
            provides = json.loads(f.provides_json or "[]")
            requires = json.loads(f.requires_json or "[]")
            evidence = json.loads(f.evidence_json or "{}")
            G.add_node(
                f.id,
                node_type="Finding",
                label=f.title,
                severity=f.severity,
                stage=f.stage,
                cvss=f.cvss,
                source_tool=f.source_tool,
                rule_id=f.rule_id,
                provides=provides,
                requires=requires,
                evidence=evidence
            )
            # Edge from asset to finding
            G.add_edge(f.asset_id, f.id, type="HAS_FINDING", derived=False)

            # Node and edge for capabilities
            for p in provides:
                cap_id = f"cap:{p}"
                if not G.has_node(cap_id):
                    G.add_node(cap_id, node_type="Capability", label=p)
                G.add_edge(f.id, cap_id, type="GRANTS", derived=False)

            for r in requires:
                cap_id = f"cap:{r}"
                if not G.has_node(cap_id):
                    G.add_node(cap_id, node_type="Capability", label=r)
                G.add_edge(cap_id, f.id, type="REQUIRES", derived=False)

        # Load static and derived edges from DB
        db_edges = db.query(Edge).filter(Edge.project_id == project_id).all()
        for e in db_edges:
            props = json.loads(e.props_json or "{}")
            G.add_edge(e.src, e.dst, type=e.type, derived=bool(e.derived), **props)

        # Compute derived network reachability if SSRF / pivot finding exists
        # E.g., if app.lab has SSRF with net_pivot_internal, it can reach internal hosts like redis.lab and git.lab
        pivot_assets: Set[str] = set()
        for f in findings:
            provides = json.loads(f.provides_json or "[]")
            if "net_pivot_internal" in provides:
                pivot_assets.add(f.asset_id)

        for pivot_asset_id in pivot_assets:
            for target in assets:
                if target.id != pivot_asset_id and target.zone in {"internal", "lab"}:
                    if not G.has_edge(pivot_asset_id, target.id):
                        G.add_edge(
                            pivot_asset_id,
                            target.id,
                            type="CAN_REACH",
                            derived=True,
                            via_pivot=True
                        )

        self._graphs[project_id] = G
        return G

    def export_cytoscape(self, project_id: str, db: Session, focus_id: Optional[str] = None, depth: int = 2) -> Dict[str, Any]:
        G = self.get_graph(project_id, db)
        nodes = []
        edges = []

        subgraph_nodes = set(G.nodes)
        if focus_id and focus_id in G:
            # Extract ego graph
            subgraph_nodes = set(nx.ego_graph(G, focus_id, radius=depth).nodes)

        for n in subgraph_nodes:
            d = G.nodes[n]
            node_data = {
                "id": str(n),
                "label": d.get("label", str(n)),
                "type": d.get("node_type", "Asset"),
                "severity": d.get("severity", "info"),
                "zone": d.get("zone", "internal"),
                "stage": d.get("stage", ""),
            }
            nodes.append({"data": node_data})

        for u, v, d in G.edges(data=True):
            if u in subgraph_nodes and v in subgraph_nodes:
                edge_id = f"e_{u}_{v}_{d.get('type', 'edge')}"
                edge_data = {
                    "id": edge_id,
                    "source": str(u),
                    "target": str(v),
                    "type": d.get("type", "CONNECTS"),
                    "derived": d.get("derived", False)
                }
                edges.append({"data": edge_data})

        return {"nodes": nodes, "edges": edges}

graph_manager = GraphManager()

