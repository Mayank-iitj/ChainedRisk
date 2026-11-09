import React, { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  BackgroundVariant,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Server,
  Database,
  Globe,
  AlertTriangle,
  Zap,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw
} from 'lucide-react';

// Custom Asset Host Node
const HostNode: React.FC<NodeProps> = ({ data, selected }) => {
  const isDmz = (data.zone || '').toLowerCase().includes('dmz');
  const isTarget = (data.zone || '').toLowerCase().includes('datastore') || (data.name || '').includes('redis') || (data.name || '').includes('db');

  return (
    <div
      className={`relative px-4 py-3 rounded-xl border font-mono transition-all duration-200 min-w-[210px] ${
        selected
          ? 'bg-[#182335] border-indigo-400 ring-2 ring-indigo-500/40 shadow-glow-indigo'
          : isTarget
          ? 'bg-[#1A1318] border-red-500/60 shadow-lg'
          : isDmz
          ? 'bg-[#1D1914] border-amber-500/60 shadow-lg'
          : 'bg-[#121821] border-[#1F2A37] hover:border-slate-500 shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-[#0B0F14]"
      />

      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          {isTarget ? (
            <Database className="w-3.5 h-3.5 text-red-400" />
          ) : isDmz ? (
            <Globe className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Server className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            {data.type || 'Host'}
          </span>
        </div>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
            isTarget
              ? 'bg-red-950/70 text-red-300 border border-red-800/80'
              : isDmz
              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
              : 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/80'
          }`}
        >
          {data.zone || 'Internal'}
        </span>
      </div>

      <div className="pt-1.5">
        <div className="text-xs font-bold text-slate-100 truncate">{data.label}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{data.id}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-[#0B0F14]"
      />
    </div>
  );
};

// Custom Finding / Vulnerability Node
const FindingNode: React.FC<NodeProps> = ({ data, selected }) => {
  const sev = (data.severity || 'medium').toLowerCase();

  const sevColors = {
    critical: {
      bg: 'bg-[#221215]',
      border: 'border-red-500/80',
      badge: 'bg-red-950/80 text-red-300 border-red-800/80',
      glow: 'shadow-red-950/40'
    },
    high: {
      bg: 'bg-[#221812]',
      border: 'border-orange-500/80',
      badge: 'bg-orange-950/80 text-orange-300 border-orange-800/80',
      glow: 'shadow-orange-950/40'
    },
    medium: {
      bg: 'bg-[#221F12]',
      border: 'border-amber-500/80',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
      glow: 'shadow-amber-950/40'
    },
    low: {
      bg: 'bg-[#0E1F28]',
      border: 'border-cyan-500/80',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
      glow: 'shadow-cyan-950/40'
    }
  }[sev] || {
    bg: 'bg-[#121821]',
    border: 'border-slate-700',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    glow: ''
  };

  return (
    <div
      className={`relative px-3.5 py-2.5 rounded-xl border font-mono transition-all duration-200 min-w-[200px] ${sevColors.bg} ${
        selected ? 'ring-2 ring-indigo-400 border-indigo-400 shadow-glow-indigo' : sevColors.border
      } ${sevColors.glow} shadow-md`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-[#0B0F14]"
      />

      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold text-slate-300">Finding</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${sevColors.badge}`}>
          {sev}
        </span>
      </div>

      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-100 truncate">{data.label}</div>
        <div className="text-[9px] text-slate-400 truncate mt-0.5">{data.id}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-[#0B0F14]"
      />
    </div>
  );
};

// Custom Capability Node
const CapabilityNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`relative px-3 py-2 rounded-lg border font-mono transition-all duration-200 min-w-[170px] bg-[#0E1E18] ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-glow-emerald'
          : 'border-emerald-600/70 hover:border-emerald-400 shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-emerald-400 !border-2 !border-[#0B0F14]"
      />

      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        <span className="text-[10px] font-bold text-emerald-300 truncate">{data.label}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-emerald-400 !border-2 !border-[#0B0F14]"
      />
    </div>
  );
};

const nodeTypes = {
  host: HostNode,
  finding: FindingNode,
  capability: CapabilityNode,
  default: HostNode
};

interface ReactFlowGraphProps {
  elements: {
    nodes: Array<{ data: any }>;
    edges: Array<{ data: any }>;
  };
  onNodeSelect?: (nodeData: any) => void;
}

export const ReactFlowGraph: React.FC<ReactFlowGraphProps> = ({
  elements,
  onNodeSelect
}) => {
  // Convert elements into ReactFlow nodes & edges with layout computation
  const { initialNodes, initialEdges } = useMemo(() => {
    const rawNodes = elements.nodes || [];
    const rawEdges = elements.edges || [];

    // Categorize nodes into 3 architectural columns
    // Col 0: DMZ / Ingress Assets & initial findings
    // Col 1: Internal pivot hosts, scanner findings, capabilities
    // Col 2: Target Crown Jewels / Internal DBs
    const col0: any[] = [];
    const col1: any[] = [];
    const col2: any[] = [];

    rawNodes.forEach((n) => {
      const d = n.data || {};
      const zone = (d.zone || '').toLowerCase();
      const type = (d.type || '').toLowerCase();
      const name = (d.label || d.id || '').toLowerCase();

      if (zone.includes('dmz') || name.includes('app.lab') || name.includes('gateway')) {
        col0.push(n);
      } else if (zone.includes('datastore') || name.includes('redis') || name.includes('internal.db') || name.includes('git')) {
        col2.push(n);
      } else {
        col1.push(n);
      }
    });

    const columns = [col0, col1, col2];
    const colX = [60, 420, 800];

    const flowNodes: any[] = [];

    columns.forEach((col, colIdx) => {
      const x = colX[colIdx];
      const spacingY = 110;
      const startY = 80;

      col.forEach((n, rowIdx) => {
        const d = n.data || {};
        const typeStr = (d.type || '').toLowerCase();
        let flowType = 'host';
        if (typeStr.includes('finding')) {
          flowType = 'finding';
        } else if (typeStr.includes('capability')) {
          flowType = 'capability';
        }

        flowNodes.push({
          id: String(d.id),
          type: flowType,
          position: { x, y: startY + rowIdx * spacingY },
          data: d
        });
      });
    });

    // If all nodes fell in one column, fall back to safe grid
    if (flowNodes.length === 0 && rawNodes.length > 0) {
      rawNodes.forEach((n, idx) => {
        const d = n.data || {};
        flowNodes.push({
          id: String(d.id),
          type: 'host',
          position: { x: 100 + (idx % 3) * 320, y: 80 + Math.floor(idx / 3) * 120 },
          data: d
        });
      });
    }

    const flowEdges: any[] = rawEdges.map((e, idx) => {
      const d = e.data || {};
      const isDerived = Boolean(d.derived);
      const edgeId = d.id || `e_${d.source}_${d.target}_${idx}`;

      return {
        id: String(edgeId),
        source: String(d.source),
        target: String(d.target),
        animated: isDerived,
        type: 'smoothstep',
        style: {
          stroke: isDerived ? '#818CF8' : '#334155',
          strokeWidth: isDerived ? 2.5 : 1.5,
          strokeDasharray: isDerived ? '6 4' : undefined
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isDerived ? '#818CF8' : '#64748B',
          width: 14,
          height: 14
        }
      };
    });

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [elements]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever elements update
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      if (onNodeSelect) {
        onNodeSelect(node.data);
      }
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#0B0F14] select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#1F2A37"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />

        <Controls
          className="!bg-[#121821] !border !border-[#1F2A37] !rounded-lg !shadow-xl !overflow-hidden [&>button]:!bg-[#121821] [&>button]:!border-b [&>button]:!border-[#1F2A37] [&>button]:!text-slate-300 hover:[&>button]:!text-white hover:[&>button]:!bg-[#1A2230] [&>button>svg]:!fill-current"
        />

        <MiniMap
          nodeColor={(n: any) => {
            if (n.type === 'finding') return '#EF4444';
            if (n.type === 'capability') return '#10B981';
            const zone = (n.data?.zone || '').toLowerCase();
            if (zone.includes('dmz')) return '#F59E0B';
            return '#6366F1';
          }}
          className="!bg-[#0E1520] !border !border-[#1F2A37] !rounded-lg"
          maskColor="rgba(11, 15, 20, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};
