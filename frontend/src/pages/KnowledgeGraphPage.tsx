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
          <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
            <span className="text-indigo-400 font-bold">Attack Graph</span> // Multimodal Knowledge Graph
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-0.5 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <span>Attack Path Knowledge Graph Studio</span>
            <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/70 text-xs font-mono font-bold px-2.5 py-0.5 rounded ml-1">
              {nodeCount} Nodes · {edgeCount} Edges
            </span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-[#121821] border border-[#1F2A37] rounded-lg p-1 text-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 px-2 uppercase">Zone:</span>
            {(['all', 'dmz', 'internal', 'findings'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setFilterZone(z)}
                className={`px-2.5 py-1 rounded capitalize font-mono text-xs transition cursor-pointer ${
                  filterZone === z
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A2230]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121821] border border-[#1F2A37] hover:border-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Graph</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Inspector Split View */}
      <div className="flex-1 min-h-0 bg-[#0B0F14] border border-[#1F2A37] rounded-xl overflow-hidden relative flex">
        {/* Cytoscape Canvas */}
        <div className="flex-1 h-full relative">
          <CytoscapeGraph elements={displayElements} onNodeSelect={(node) => setSelectedNode(node)} />

          {/* Floating Canvas Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-[#121821]/95 border border-[#1F2A37] rounded-lg p-3 shadow-xl text-[11px] font-mono space-y-1.5 pointer-events-auto backdrop-blur-md">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Topology Zones
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">DMZ (Public-Facing Endpoint)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span className="text-slate-300">Internal Subnet / Pivot (10.77.0.0/24)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="text-slate-300">Crown Jewel Datastore (Target)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300">Correlated Attack Edge</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Side Drawer */}
        {selectedNode && (
          <div className="w-80 border-l border-[#1F2A37] bg-[#121821] p-5 overflow-y-auto space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2A37]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="font-mono uppercase font-bold text-xs text-slate-200 tracking-wider">Node Telemetry</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-100">{selectedNode.label}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedNode.id}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#0B0F14] border border-[#1F2A37] rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Zone / Classification</span>
                <span className="font-mono font-semibold text-slate-200 capitalize">{selectedNode.zone || 'Internal'}</span>
              </div>

              {selectedNode.requires && (
                <div className="p-3 bg-[#0B0F14] border border-[#1F2A37] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Preconditions (Requires)</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.requires.map((req: string, i: number) => (
                      <span key={i} className="bg-amber-950/60 text-amber-300 border border-amber-800/70 text-[10px] font-mono px-2 py-0.5 rounded">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.provides && (
                <div className="p-3 bg-[#0B0F14] border border-[#1F2A37] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Postconditions (Provides)</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.provides.map((prov: string, i: number) => (
                      <span key={i} className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/70 text-[10px] font-mono px-2 py-0.5 rounded">
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
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase tracking-wider font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/50"
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
