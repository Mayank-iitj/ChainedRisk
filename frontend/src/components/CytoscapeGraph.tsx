import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface CytoscapeGraphProps {
  elements: {
    nodes: Array<{ data: any }>;
    edges: Array<{ data: any }>;
  };
  onNodeSelect?: (nodeData: any) => void;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({ elements, onNodeSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#334155',
            'font-size': '11px',
            'font-family': 'JetBrains Mono, Inter, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#f8fafc',
            'border-width': 2,
            'border-color': '#94a3b8',
            'width': 36,
            'height': 36
          }
        },
        // Asset Hosts
        {
          selector: 'node[type = "Host"]',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#ffffff',
            'border-color': '#6366f1',
            'border-width': 2.5,
            'width': 44,
            'height': 44
          }
        },
        // Findings
        {
          selector: 'node[type = "Finding"]',
          style: {
            'shape': 'diamond',
            'background-color': '#eef2ff',
            'border-color': '#6366f1',
            'width': 32,
            'height': 32
          }
        },
        // Severity colored findings
        {
          selector: 'node[severity = "critical"]',
          style: {
            'background-color': '#fee2e2',
            'border-color': '#ef4444',
            'border-width': 3
          }
        },
        {
          selector: 'node[severity = "high"]',
          style: {
            'background-color': '#ffedd5',
            'border-color': '#f97316'
          }
        },
        {
          selector: 'node[severity = "medium"]',
          style: {
            'background-color': '#fef3c7',
            'border-color': '#f59e0b'
          }
        },
        {
          selector: 'node[severity = "low"]',
          style: {
            'background-color': '#e0f2fe',
            'border-color': '#0ea5e9'
          }
        },
        // Capabilities
        {
          selector: 'node[type = "Capability"]',
          style: {
            'shape': 'ellipse',
            'background-color': '#ecfdf5',
            'border-color': '#10b981',
            'width': 28,
            'height': 28
          }
        },
        // Edges
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#cbd5e1',
            'target-arrow-color': '#cbd5e1',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8
          }
        },
        // Derived Pivot Edges
        {
          selector: 'edge[derived = true]',
          style: {
            'line-color': '#6366f1',
            'target-arrow-color': '#6366f1',
            'line-style': 'dashed',
            'width': 2.5,
            'line-dash-pattern': [6, 4]
          }
        },
        // Active selected
        {
          selector: ':selected',
          style: {
            'border-color': '#4f46e5',
            'border-width': 3,
            'shadow-blur': 10,
            'shadow-color': '#6366f1',
            'shadow-opacity': 0.4
          } as any
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        componentSpacing: 120,
        nodeOverlap: 40
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());
      if (onNodeSelect) onNodeSelect(node.data());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit();
  const handleRelayout = () => {
    cyRef.current?.layout({ name: 'cose', animate: true }).run();
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-sm">
      {/* Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-xs">
        <button
          onClick={handleZoomIn}
          className="p-1 hover:text-indigo-600 text-slate-500 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1 hover:text-indigo-600 text-slate-500 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          className="p-1 hover:text-indigo-600 text-slate-500 transition cursor-pointer"
          title="Fit Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRelayout}
          className="p-1 hover:text-indigo-600 text-slate-500 transition cursor-pointer"
          title="Reorganize Layout"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-slate-200 px-3.5 py-2.5 rounded-xl text-[11px] font-mono text-slate-600 shadow-sm backdrop-blur-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-white border-2 border-indigo-500"></span>
          <span>Asset (Host/Container)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rotate-45 bg-rose-50 border border-rose-500"></span>
          <span>Scanner Finding</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-50 border border-emerald-500"></span>
          <span>Capability Token</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-b-2 border-indigo-500 border-dashed"></span>
          <span>Derived SSRF Pivot Edge</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing bg-slate-50/30" />

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl text-xs space-y-3 max-h-[90%] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-mono text-indigo-600 font-bold uppercase">{selectedNode.type} Node</span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          <div>
            <div className="text-slate-800 font-bold text-sm">{selectedNode.label}</div>
            <div className="text-slate-400 font-mono text-[11px]">ID: {selectedNode.id}</div>
          </div>

          {selectedNode.severity && (
            <div>
              <span className="text-slate-400 block font-mono text-[10px]">Severity</span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedNode.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                selectedNode.severity === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                selectedNode.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>
                {selectedNode.severity}
              </span>
            </div>
          )}

          {selectedNode.zone && (
            <div>
              <span className="text-slate-400 block font-mono text-[10px]">Zone</span>
              <span className="text-slate-700 font-mono font-medium">{selectedNode.zone}</span>
            </div>
          )}

          {selectedNode.stage && (
            <div>
              <span className="text-slate-400 block font-mono text-[10px]">Assessment Stage</span>
              <span className="text-slate-700 font-mono capitalize">{selectedNode.stage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
