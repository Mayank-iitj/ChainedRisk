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
            'color': '#94A3B8',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#121821',
            'border-width': 1.5,
            'border-color': '#334155',
            'width': 34,
            'height': 34
          }
        },
        // Asset Hosts
        {
          selector: 'node[type = "Host"]',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#161F2E',
            'border-color': '#6366F1',
            'border-width': 2,
            'color': '#E2E8F0',
            'width': 42,
            'height': 42
          }
        },
        // Findings
        {
          selector: 'node[type = "Finding"]',
          style: {
            'shape': 'diamond',
            'background-color': '#1E1B2E',
            'border-color': '#818CF8',
            'width': 30,
            'height': 30
          }
        },
        // Severity colored findings
        {
          selector: 'node[severity = "critical"]',
          style: {
            'background-color': '#2A1215',
            'border-color': '#EF4444',
            'color': '#FCA5A5',
            'border-width': 2.5
          }
        },
        {
          selector: 'node[severity = "high"]',
          style: {
            'background-color': '#2A1B12',
            'border-color': '#F97316',
            'color': '#FDBA74'
          }
        },
        {
          selector: 'node[severity = "medium"]',
          style: {
            'background-color': '#2A2412',
            'border-color': '#F59E0B',
            'color': '#FCD34D'
          }
        },
        {
          selector: 'node[severity = "low"]',
          style: {
            'background-color': '#0F232E',
            'border-color': '#06B6D4',
            'color': '#67E8F9'
          }
        },
        // Capabilities
        {
          selector: 'node[type = "Capability"]',
          style: {
            'shape': 'ellipse',
            'background-color': '#0F261E',
            'border-color': '#10B981',
            'color': '#6EE7B7',
            'width': 28,
            'height': 28
          }
        },
        // Edges
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8
          }
        },
        // Derived Pivot Edges
        {
          selector: 'edge[derived = true]',
          style: {
            'line-color': '#6366F1',
            'target-arrow-color': '#818CF8',
            'line-style': 'dashed',
            'width': 2,
            'line-dash-pattern': [6, 4]
          }
        },
        // Active selected
        {
          selector: ':selected',
          style: {
            'border-color': '#818CF8',
            'border-width': 3,
            'shadow-blur': 12,
            'shadow-color': '#6366F1',
            'shadow-opacity': 0.6
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
    <div className="relative w-full h-full min-h-[500px] bg-[#0B0F14] border border-[#1F2A37] rounded-xl overflow-hidden flex flex-col">
      {/* Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#0A0A0A]/90 border border-[#262626] px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          className="p-1 hover:text-white text-neutral-400 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1 hover:text-white text-neutral-400 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFit}
          className="p-1 hover:text-white text-neutral-400 transition cursor-pointer"
          title="Fit Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleRelayout}
          className="p-1 hover:text-white text-neutral-400 transition cursor-pointer"
          title="Reorganize Layout"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#0A0A0A]/90 border border-[#262626] px-3 py-2 rounded-lg text-[10px] font-mono text-neutral-400 shadow-lg backdrop-blur-md space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded bg-black border border-white"></span>
          <span>Asset (Host/Container)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rotate-45 bg-white border border-white"></span>
          <span>Scanner Finding</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-400"></span>
          <span>Capability Token</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-b border-white border-dashed"></span>
          <span>Derived Pivot Edge</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing bg-black" />

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-80 bg-[#0A0A0A]/95 border border-[#262626] rounded-xl p-4 shadow-2xl text-xs space-y-3 max-h-[90%] overflow-y-auto backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-[#262626] pb-2">
            <span className="font-mono text-white font-bold uppercase text-[11px] tracking-wider">{selectedNode.type} Node</span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div>
            <div className="text-white font-bold text-sm">{selectedNode.label}</div>
            <div className="text-neutral-400 font-mono text-[10px] mt-0.5">ID: {selectedNode.id}</div>
          </div>

          {selectedNode.severity && (
            <div>
              <span className="text-neutral-400 block font-mono text-[10px] uppercase">Severity</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase mt-1 ${
                selectedNode.severity === 'critical' ? 'bg-white text-black font-bold' :
                selectedNode.severity === 'high' ? 'border border-white text-white bg-black' :
                'border border-neutral-600 text-neutral-300 bg-black'
              }`}>
                {selectedNode.severity}
              </span>
            </div>
          )}

          {selectedNode.zone && (
            <div>
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Zone</span>
              <span className="text-slate-200 font-mono text-xs">{selectedNode.zone}</span>
            </div>
          )}

          {selectedNode.stage && (
            <div>
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Stage</span>
              <span className="text-slate-200 font-mono text-xs capitalize">{selectedNode.stage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
