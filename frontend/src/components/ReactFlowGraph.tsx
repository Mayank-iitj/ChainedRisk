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
  Shield
} from 'lucide-react';

// Custom Monochrome Host Node
const HostNode: React.FC<NodeProps> = ({ data, selected }) => {
  const isDmz = (data.zone || '').toLowerCase().includes('dmz');
  const isTarget = (data.zone || '').toLowerCase().includes('datastore') || (data.name || '').includes('redis') || (data.name || '').includes('db');

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border font-mono transition-all duration-200 min-w-[210px] ${
        selected
          ? 'bg-black border-2 border-white ring-2 ring-white/30 shadow-lg'
          : isTarget
          ? 'bg-[#0A0A0A] border-2 border-white shadow-md'
          : isDmz
          ? 'bg-[#0A0A0A] border border-neutral-300 shadow-sm'
          : 'bg-[#0A0A0A] border border-[#333333] hover:border-neutral-400 shadow-sm'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-white !border !border-black"
      />

      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#262626]">
        <div className="flex items-center gap-1.5">
          {isTarget ? (
            <Database className="w-3.5 h-3.5 text-white" />
          ) : isDmz ? (
            <Globe className="w-3.5 h-3.5 text-white" />
          ) : (
            <Server className="w-3.5 h-3.5 text-white" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
            {data.type || 'Host'}
          </span>
        </div>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
            isTarget
              ? 'bg-white text-black font-bold'
              : isDmz
              ? 'border border-white text-white'
              : 'border border-neutral-600 text-neutral-300'
          }`}
        >
          {data.zone || 'Internal'}
        </span>
      </div>

      <div className="pt-1.5">
        <div className="text-xs font-bold text-white truncate">{data.label}</div>
        <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">{data.id}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-white !border !border-black"
      />
    </div>
  );
};

// Custom Monochrome Finding Node
const FindingNode: React.FC<NodeProps> = ({ data, selected }) => {
  const sev = (data.severity || 'medium').toLowerCase();

  return (
    <div
      className={`relative px-3.5 py-2.5 rounded-lg border font-mono transition-all duration-200 min-w-[200px] bg-[#0A0A0A] ${
        selected
          ? 'ring-2 ring-white border-2 border-white shadow-lg'
          : sev === 'critical'
          ? 'border-2 border-white'
          : 'border border-[#333333] hover:border-neutral-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-white !border !border-black"
      />

      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-[#262626]">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
          <span className="text-[10px] font-bold text-white uppercase">Finding</span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
            sev === 'critical'
              ? 'bg-white text-black font-bold'
              : sev === 'high'
              ? 'border border-white text-white'
              : 'border border-neutral-500 text-neutral-300'
          }`}
        >
          {sev}
        </span>
      </div>

      <div className="pt-1">
        <div className="text-[11px] font-bold text-white truncate">{data.label}</div>
        <div className="text-[9px] text-neutral-400 truncate mt-0.5">{data.id}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-white !border !border-black"
      />
    </div>
  );
};

// Custom Monochrome Capability Node
const CapabilityNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`relative px-3 py-2 rounded border font-mono transition-all duration-200 min-w-[170px] bg-[#0A0A0A] ${
        selected
          ? 'border-2 border-white ring-2 ring-white/30 text-white font-bold'
          : 'border border-neutral-400 hover:border-white text-neutral-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-white !border !border-black"
      />

      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-white flex-shrink-0" />
        <span className="text-[10px] font-bold text-white truncate">{data.label}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-white !border !border-black"
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
  const { initialNodes, initialEdges } = useMemo(() => {
    const rawNodes = elements.nodes || [];
    const rawEdges = elements.edges || [];

    const col0: any[] = [];
    const col1: any[] = [];
    const col2: any[] = [];

    rawNodes.forEach((n) => {
      const d = n.data || {};
      const zone = (d.zone || '').toLowerCase();
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
          stroke: isDerived ? '#FFFFFF' : '#444444',
          strokeWidth: isDerived ? 2.5 : 1.5,
          strokeDasharray: isDerived ? '6 4' : undefined
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isDerived ? '#FFFFFF' : '#888888',
          width: 14,
          height: 14
        }
      };
    });

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [elements]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
    <div className="relative w-full h-full min-h-[500px] bg-black select-none">
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
          color="#262626"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />

        <Controls
          className="!bg-black !border !border-[#333333] !rounded !shadow-xl !overflow-hidden [&>button]:!bg-black [&>button]:!border-b [&>button]:!border-[#333333] [&>button]:!text-neutral-400 hover:[&>button]:!text-white hover:[&>button]:!bg-[#181818] [&>button>svg]:!fill-current"
        />

        <MiniMap
          nodeColor={(n: any) => {
            if (n.type === 'finding') return '#E5E5E5';
            if (n.type === 'capability') return '#A3A3A3';
            return '#FFFFFF';
          }}
          className="!bg-[#0A0A0A] !border !border-[#333333] !rounded"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  );
};
