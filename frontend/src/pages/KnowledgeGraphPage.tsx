import React, { useState, useEffect } from 'react';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Filter,
  Download,
  Info,
  Shield,
  X,
  ExternalLink,
  Sparkles,
  GitMerge
} from 'lucide-react';
import { CytoscapeGraph } from '../components/CytoscapeGraph';
import { fetchGraph } from '../api';

interface KnowledgeGraphPageProps {
  projectId: string;
  onNavigateToChain?: (chainId: string) => void;
}

export const KnowledgeGraphPage: React.FC<KnowledgeGraphPageProps> = ({
  projectId,
  onNavigateToChain
}) => {
  const [elements, setElements] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState<number>(3);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    loadGraph();
  }, [projectId, depth]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchGraph(projectId);
      setElements(data || { nodes: [], edges: [] });
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chainedrisk-graph-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter elements based on zone if needed
  const displayElements = React.useMemo(() => {
    if (filterZone === 'all') return elements;
    const allowedNodeIds = new Set<string>();
    const filteredNodes = elements.nodes.filter((n) => {
      const zone = (n.data?.zone || n.data?.type || '').toLowerCase();
      if (filterZone === 'dmz' && zone.includes('dmz')) {
        allowedNodeIds.add(n.data.id);
        return true;
      }
      if (filterZone === 'internal' && (zone.includes('internal') || zone.includes('datastore'))) {
        allowedNodeIds.add(n.data.id);
        return true;
      }
      if (filterZone === 'findings' && n.data?.type === 'finding') {
        allowedNodeIds.add(n.data.id);
        return true;
      }
      return false;
    });

    const filteredEdges = elements.edges.filter((e) =>
      allowedNodeIds.has(e.data.source) || allowedNodeIds.has(e.data.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [elements, filterZone]);

  const nodeCount = displayElements.nodes.length;
  const edgeCount = displayElements.edges.length;

  return (
    <div className="space-y-4 pb-8 flex flex-col h-[calc(100vh-120px)]">
      {/* Header & Controls Toolbar */}
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#64748b]">
            <span className="text-[#6366f1] font-bold">Attack Graph</span> / Multimodal Knowledge Graph
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#6366f1]" />
            <span>Attack Path Knowledge Graph Studio</span>
            <span className="bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe] text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ml-1">
              {nodeCount} Nodes · {edgeCount} Edges
            </span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-[#eef2f6] rounded-xl p-1 text-xs shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">View:</span>
            {(['all', 'dmz', 'internal', 'findings'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setFilterZone(z)}
                className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition cursor-pointer text-xs ${
                  filterZone === z
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Graph</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Inspector Split View */}
      <div className="flex-1 min-h-0 bg-white border border-[#eef2f6] rounded-2xl shadow-card overflow-hidden relative flex">
        {/* Cytoscape Canvas */}
        <div className="flex-1 h-full relative">
          <CytoscapeGraph elements={displayElements} />

          {/* Floating Canvas Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl p-3 shadow-md text-[11px] font-mono space-y-1.5 pointer-events-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">
              Graph Zone Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
              <span className="text-slate-700">DMZ (Public-Facing Endpoint)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span>
              <span className="text-slate-700">Internal Subnet / Pivot (10.77.0.0/24)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
              <span className="text-slate-700">Crown Jewel Datastore (Breach Target)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
              <span className="text-slate-700">Correlated Attack Edge</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Side Drawer */}
        {selectedNode && (
          <div className="w-80 border-l border-slate-200 bg-slate-50/70 p-5 overflow-y-auto space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs text-slate-800">Node Telemetry</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800">{selectedNode.label}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedNode.id}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Zone / Classification</span>
                <span className="font-semibold text-slate-700 capitalize">{selectedNode.zone || 'Internal'}</span>
              </div>

              {selectedNode.requires && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Preconditions (Requires)</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.requires.map((req: string, i: number) => (
                      <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono px-2 py-0.5 rounded">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.provides && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Postconditions (Provides)</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.provides.map((prov: string, i: number) => (
                      <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded">
                        {prov}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {onNavigateToChain && (
              <button
                onClick={() => onNavigateToChain('chn_demo_01')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Inspect in Attack Chain</span>
                <GitMerge className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
