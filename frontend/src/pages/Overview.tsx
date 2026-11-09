import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PlayCircle,
  Shield,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles,
  Server,
  Zap,
  Globe,
  Database,
  Terminal,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { ProjectStats, AttackChain } from '../types';

interface OverviewProps {
  stats: ProjectStats | null;
  chains: AttackChain[];
  onSelectChain: (chainId: string) => void;
  onLoadDemo: () => void;
  loading: boolean;
  projectName?: string;
  orgName?: string;
  onNavigateTab?: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  stats,
  chains,
  onSelectChain,
  onLoadDemo,
  loading,
  projectName,
  orgName,
  onNavigateTab
}) => {
  const [timeFilter, setTimeFilter] = React.useState<'all' | '1m' | '6m' | '1y'>('all');
  const [tableFilter, setTableFilter] = React.useState<'all' | 'active' | 'verified'>('all');

  const topChain = chains[0];

  const filteredChains = chains.filter((chain) => {
    if (tableFilter === 'verified') return chain.status === 'confirmed';
    if (tableFilter === 'active') return chain.status === 'planned' || chain.status === 'hypothesis' || chain.status === 'verifying';
    return true;
  });

  const labAssets = stats?.target_assets || [];
  const crownJewels = stats?.crown_jewels || [];

  const getPivotTarget = (chain: AttackChain) => {
    if (chain.steps && chain.steps.length > 0) {
      const lastStep = chain.steps[chain.steps.length - 1];
      if (lastStep.narrative) {
        if (lastStep.narrative.toLowerCase().includes('redis')) return 'redis.lab (Internal)';
        if (lastStep.narrative.toLowerCase().includes('git')) return 'git.lab (SCM)';
        if (lastStep.narrative.toLowerCase().includes('sql') || lastStep.narrative.toLowerCase().includes('database')) return 'db.internal';
        if (lastStep.narrative.toLowerCase().includes('ssrf')) return 'ssrf-proxy (DMZ)';
      }
    }
    return 'Internal Subnet';
  };

  return (
    <div className="space-y-6 pb-8 select-none font-mono text-white">
      {/* Breadcrumb & Action Banner */}
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-neutral-500 uppercase flex items-center gap-2">
            <span>ENCLAVE //</span>
            <span className="text-white font-bold">{orgName || 'Workspace'}</span>
            <span>/</span>
            <span className="text-neutral-300">{projectName || 'Risk Correlation & Attack Paths'}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2.5 font-mono">
            <span>OPERATIONAL COMMAND CENTER</span>
            <span className="text-[10px] font-mono text-black bg-white border border-white px-2 py-0.5 rounded font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              LIVE TELEMETRY
            </span>
          </h2>
        </div>

        <button
          onClick={onLoadDemo}
          disabled={loading}
          className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold px-4 py-2 rounded transition cursor-pointer disabled:opacity-60 shadow"
        >
          <PlayCircle className="w-4 h-4 text-black" />
          <span>{loading ? 'CORRELATING...' : 'RUN ATTACK CORRELATION'}</span>
        </button>
      </div>

      {/* Top 5 Tactical Metric Tiles */}
      <div className="reveal-block grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Findings */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-4 hover:border-white transition">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>RAW FINDINGS</span>
            <span className="p-1 rounded bg-black border border-[#262626] text-white">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {stats?.findings ?? 0}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-white bg-black border border-white/40 px-2 py-0.5 rounded w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>Multi-Tool Ingested</span>
          </div>
        </div>

        {/* Metric 2: Noise Reduction */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-4 hover:border-white transition">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>NOISE REDUCTION</span>
            <span className="p-1 rounded bg-black border border-[#262626] text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {stats?.noise_reduction_percent ?? 0}%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-white bg-black border border-white/40 px-2 py-0.5 rounded w-fit">
            <TrendingDown className="w-3 h-3" />
            <span>-{stats?.noise_reduction_percent ?? 0}% Alert Fatigue</span>
          </div>
        </div>

        {/* Metric 3: Attack Paths */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-4 hover:border-white transition">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>ATTACK PATHS</span>
            <span className="p-1 rounded bg-black border border-[#262626] text-white">
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {chains.length}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-white bg-black border border-white/40 px-2 py-0.5 rounded w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>Multi-Stage Chained</span>
          </div>
        </div>

        {/* Metric 4: Critical Chain Risk */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-4 hover:border-white transition">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>MAX CHAIN RISK</span>
            <span className="p-1 rounded bg-black border border-[#262626] text-white">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {topChain?.score ?? 0}<span className="text-sm text-neutral-500 font-normal">/100</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-bold text-black bg-white px-2 py-0.5 rounded w-fit">
            <AlertTriangle className="w-3 h-3 text-black" />
            <span>CRITICAL (RCE PIVOT)</span>
          </div>
        </div>

        {/* Metric 5: In-Lab Verified */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-4 hover:border-white transition">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>LAB VERIFIED</span>
            <span className="p-1 rounded bg-black border border-[#262626] text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {stats?.verified_chains ?? 0}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-white bg-black border border-white/40 px-2 py-0.5 rounded w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>HITL Signed</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Severity Illusion Curve + Active Target Assets */}
      <div className="reveal-block grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: The Severity Illusion Chart */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-[#262626] rounded-lg p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-white" />
                <span>The Severity Illusion & Attack Trajectory</span>
              </h3>
              <div className="flex items-center gap-4 text-xs mt-1.5 font-mono">
                <span className="flex items-center gap-1.5 text-white font-bold">
                  <span className="w-2 h-2 bg-white"></span>
                  Correlated Chain: {topChain?.score ?? (stats?.chains ? 90 : 0)} ({topChain?.severity?.toUpperCase() || (topChain ? 'CRITICAL' : 'NONE')})
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-2 h-2 border border-neutral-400"></span>
                  Max Isolated Finding: {topChain ? Math.max(10, Math.round(topChain.score - (topChain.chain_gain || 0))) : 0} (Isolated)
                </span>
              </div>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-black border border-[#262626] p-1 rounded text-xs font-mono">
              {(['all', '1m', '6m', '1y'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-2.5 py-0.5 rounded uppercase text-[10px] transition cursor-pointer ${
                    timeFilter === filter
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Monochrome Curve Graph */}
          <div className="relative w-full h-56 pt-2">
            <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="monoGradientSurge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#222222" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="#222222" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="#222222" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#222222" strokeWidth="1" strokeDasharray="3 3" />

              {/* Shaded area under surge */}
              <path
                d="M 0 150 C 50 145, 100 140, 150 135 C 200 130, 250 110, 300 85 C 350 60, 400 45, 450 35 C 500 30, 550 25, 600 22 L 600 180 L 0 180 Z"
                fill="url(#monoGradientSurge)"
              />

              {/* Gray Dashed Line (Isolated Findings plateau) */}
              <path
                d="M 0 115 C 50 110, 100 112, 150 110 C 200 108, 250 105, 300 105 C 350 105, 400 105, 450 105 C 500 105, 550 105, 600 105"
                fill="none"
                stroke="#666666"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* White Solid Line (Correlated Chain Risk Surge) */}
              <path
                d="M 0 150 C 50 145, 100 140, 150 135 C 200 130, 250 110, 300 85 C 350 60, 400 45, 450 35 C 500 30, 550 25, 600 22"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
              />

              {/* Surge Callout Pin */}
              <circle cx="300" cy="85" r="5" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
              <rect x="310" y="65" width="85" height="24" rx="3" fill="#FFFFFF" />
              <text x="352" y="81" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="monospace">
                +{topChain?.chain_gain ?? 0} GAIN
              </text>
            </svg>

            {/* Dynamic X-axis labels */}
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-2 px-1">
              <span>Origin: Ingress</span>
              {topChain?.steps && topChain.steps.length > 0 ? (
                topChain.steps.map((st, i) => (
                  <span key={i} className="truncate max-w-[110px]" title={st.narrative || `Step ${st.order}`}>
                    Stage {st.order}: {st.provides?.[0] ? st.provides[0].replace(/_/g, ' ') : `Step ${st.order}`}
                  </span>
                ))
              ) : (
                <>
                  <span>Stage 1: Perimeter</span>
                  <span>Stage 2: Pivot</span>
                  <span>Stage 3: Escalate</span>
                </>
              )}
              <span className="text-white font-bold">Target Compromised</span>
            </div>
          </div>

          <div className="p-3 bg-black border border-[#262626] rounded flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              {topChain ? (
                <>
                  MECHANICS: <strong className="text-white">{topChain.title}</strong> — achieves <strong className="text-white">Score {topChain.score}/100</strong> (+{topChain.chain_gain} Gain).
                </>
              ) : (
                <>No correlated attack paths identified yet. Ingest scanner artifacts or run correlation.</>
              )}
            </span>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('chains') : onSelectChain(topChain?.id || '')}
              className="text-white hover:underline font-bold transition cursor-pointer flex-shrink-0 ml-2"
            >
              Inspect Attack Tree →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Active Target Assets */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Server className="w-4 h-4 text-white" />
              <span>Perimeter Targets</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">{labAssets.length} Active</span>
          </div>

          <div className="space-y-3">
            {labAssets.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 space-y-2 font-mono">
                <p className="text-xs">No assets mapped yet in this project.</p>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('ingest')}
                  className="text-xs text-white font-bold hover:underline cursor-pointer"
                >
                  Ingest Scans in Ingest Studio →
                </button>
              </div>
            ) : (
              labAssets.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-black border border-[#262626] rounded space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span className="font-bold text-white font-mono">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">{item.progress}% Risk</span>
                  </div>

                  {/* Monochrome Progress Bar */}
                  <div className="w-full bg-[#222222] h-1.5 rounded overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>{item.tech}</span>
                    <span className="text-neutral-300">{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Prioritized Breach Paths + Crown Jewels */}
      <div className="reveal-block grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bottom Left 2 Cols: Attack Chains Table */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-[#262626] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Flame className="w-4 h-4 text-white" />
              <span>Prioritized Attack Paths</span>
            </h3>

            <div className="flex items-center gap-1 bg-black border border-[#262626] p-1 rounded text-xs font-mono">
              {(['all', 'active', 'verified'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTableFilter(f)}
                  className={`px-2.5 py-0.5 rounded capitalize text-[10px] transition cursor-pointer ${
                    tableFilter === f
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredChains.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 space-y-2 font-mono">
                <p className="text-xs">No attack chains matched filter "{tableFilter}".</p>
                {chains.length === 0 && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('ingest')}
                    className="text-xs text-white font-bold hover:underline cursor-pointer"
                  >
                    Click here to ingest scanner telemetry →
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-black text-neutral-400 text-[10px] uppercase tracking-wider border-b border-[#262626]">
                    <th className="py-2.5 px-3">ATTACK CHAIN</th>
                    <th className="py-2.5 px-3">PIVOT TARGET</th>
                    <th className="py-2.5 px-3">GAIN</th>
                    <th className="py-2.5 px-3">SCORE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {filteredChains.map((chain, idx) => (
                    <tr
                      key={chain.id || idx}
                      onClick={() => onSelectChain(chain.id)}
                      className="hover:bg-white/[0.05] transition cursor-pointer"
                    >
                      <td className="py-3 px-3 font-bold text-white max-w-[220px] truncate">
                        {chain.title}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">{getPivotTarget(chain)}</td>
                      <td className="py-3 px-3 text-white font-bold">+{chain.chain_gain} Pts</td>
                      <td className="py-3 px-3 text-white font-bold">{chain.score}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            chain.status === 'confirmed'
                              ? 'bg-white text-black font-bold'
                              : chain.status === 'planned'
                              ? 'border border-white text-white'
                              : 'border border-neutral-600 text-neutral-400'
                          }`}
                        >
                          {chain.status === 'confirmed' ? 'Verified' : chain.status === 'planned' ? 'Planned' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-white hover:underline font-bold transition cursor-pointer">
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bottom Right 1 Col: Crown Jewels */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-white" />
              <span>Crown Jewel Targets</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">{crownJewels.length} Target(s)</span>
          </div>

          <div className="space-y-2.5">
            {crownJewels.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 space-y-1 font-mono">
                <p className="text-xs">No crown jewel datastores identified.</p>
                <p className="text-[10px] text-neutral-600">Internal databases will appear here.</p>
              </div>
            ) : (
              crownJewels.map((target, idx) => (
                <div key={target.id || idx} className="flex items-center justify-between p-3 rounded bg-black border border-[#262626] hover:border-white transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1A1A1A] border border-white/30 text-white font-mono font-bold flex items-center justify-center text-xs">
                      {target.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs font-mono">{target.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{target.id} • {target.ip}</div>
                    </div>
                  </div>

                  <span className="bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/40">
                    {target.tag}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
