import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  MoreVertical,
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
    <div className="space-y-6 pb-8 select-none">
      {/* Breadcrumb & Action Banner */}
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-[#64748B] uppercase flex items-center gap-2">
            <span>ENCLAVE //</span>
            <span className="text-[#6366F1] font-semibold">{orgName || 'Workspace'}</span>
            <span>/</span>
            <span className="text-slate-300">{projectName || 'Risk Correlation & Attack Paths'}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2.5">
            <span>Security Operations Center</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </h2>
        </div>

        <button
          onClick={onLoadDemo}
          disabled={loading}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-mono text-xs font-semibold px-4 py-2 rounded-xl shadow-glow-indigo transition cursor-pointer disabled:opacity-60"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{loading ? 'CORRELATING...' : 'RUN ATTACK CORRELATION'}</span>
        </button>
      </div>

      {/* Top 5 Tactical Metric Tiles */}
      <div className="reveal-block grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Findings */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-4.5 hover:border-[#2D3A4B] transition shadow-card">
          <div className="flex justify-between items-center text-xs text-[#94A3B8] font-mono">
            <span>RAW FINDINGS</span>
            <span className="p-1.5 rounded-lg bg-[#0B0F14] border border-[#1F2A37] text-slate-400">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {stats?.findings ?? 0}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>Multi-Tool Ingested</span>
          </div>
        </div>

        {/* Metric 2: Noise Reduction */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-4.5 hover:border-[#2D3A4B] transition shadow-card">
          <div className="flex justify-between items-center text-xs text-[#94A3B8] font-mono">
            <span>NOISE REDUCTION</span>
            <span className="p-1.5 rounded-lg bg-[#0B0F14] border border-[#1F2A37] text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2 tracking-tight">
            {stats?.noise_reduction_percent ?? 0}%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded w-fit">
            <TrendingDown className="w-3 h-3" />
            <span>-{stats?.noise_reduction_percent ?? 0}% Alert Fatigue</span>
          </div>
        </div>

        {/* Metric 3: Attack Paths */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-4.5 hover:border-[#2D3A4B] transition shadow-card">
          <div className="flex justify-between items-center text-xs text-[#94A3B8] font-mono">
            <span>ATTACK PATHS</span>
            <span className="p-1.5 rounded-lg bg-[#0B0F14] border border-[#1F2A37] text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tracking-tight">
            {chains.length}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>Multi-Stage Chained</span>
          </div>
        </div>

        {/* Metric 4: Critical Chain Risk */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-4.5 hover:border-[#2D3A4B] transition shadow-card">
          <div className="flex justify-between items-center text-xs text-[#94A3B8] font-mono">
            <span>MAX CHAIN RISK</span>
            <span className="p-1.5 rounded-lg bg-[#0B0F14] border border-[#1F2A37] text-rose-400">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2 tracking-tight">
            {topChain?.score ?? 0}<span className="text-sm text-slate-500 font-normal">/100</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>CRITICAL (RCE Pivot)</span>
          </div>
        </div>

        {/* Metric 5: In-Lab Verified */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-4.5 hover:border-[#2D3A4B] transition shadow-card">
          <div className="flex justify-between items-center text-xs text-[#94A3B8] font-mono">
            <span>LAB VERIFIED</span>
            <span className="p-1.5 rounded-lg bg-[#0B0F14] border border-[#1F2A37] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 tracking-tight">
            {stats?.verified_chains ?? 0}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>HITL Signed</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Severity Illusion Curve + Active Target Assets */}
      <div className="reveal-block grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: The Severity Illusion Chart */}
        <div className="lg:col-span-2 bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#6366F1]" />
                <span>The Severity Illusion & Attack Trajectory</span>
              </h3>
              <div className="flex items-center gap-4 text-xs mt-1.5 font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Correlated Chain: {topChain?.score ?? 91} (Critical)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Max Isolated Finding: 50 (Medium)
                </span>
              </div>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-[#0B0F14] border border-[#1F2A37] p-1 rounded-lg text-xs font-mono">
              {(['all', '1m', '6m', '1y'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-2.5 py-0.5 rounded uppercase text-[10px] transition cursor-pointer ${
                    timeFilter === filter
                      ? 'bg-[#6366F1] text-white font-bold'
                      : 'text-[#64748B] hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Smooth Curve Graph */}
          <div className="relative w-full h-56 pt-2">
            <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradientSurge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#1F2A37" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="#1F2A37" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="#1F2A37" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#1F2A37" strokeWidth="1" strokeDasharray="3 3" />

              {/* Amber Line (Isolated Findings plateau) */}
              <path
                d="M 0 115 C 50 110, 100 112, 150 110 C 200 108, 250 105, 300 105 C 350 105, 400 105, 450 105 C 500 105, 550 105, 600 105"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Red Line (Correlated Chain Risk Surge) */}
              <path
                d="M 0 150 C 50 145, 100 140, 150 135 C 200 130, 250 110, 300 85 C 350 60, 400 45, 450 35 C 500 30, 550 25, 600 22"
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
              />

              {/* Surge Callout Pin */}
              <circle cx="300" cy="85" r="5" fill="#EF4444" stroke="#0B0F14" strokeWidth="2" />
              <rect x="310" y="65" width="85" height="24" rx="4" fill="#EF4444" />
              <text x="352" y="81" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="monospace">
                +{topChain?.chain_gain ?? 40} GAIN
              </text>
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 px-1">
              <span>Hop 0: Recon</span>
              <span>Hop 1: .git Leak</span>
              <span>Hop 2: SSRF Proxy</span>
              <span>Hop 3: Pivot Subnet</span>
              <span>Hop 4: Redis 6379</span>
              <span className="text-rose-400 font-semibold">Critical Breach</span>
            </div>
          </div>

          <div className="p-3 bg-[#0B0F14] border border-[#1F2A37] rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              MECHANICS: Low/Med alerts surge to <strong className="text-rose-400">Score {topChain?.score ?? 91}</strong> via SSRF proxy capability bridge.
            </span>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('chains') : onSelectChain(topChain?.id || '')}
              className="text-[#6366F1] hover:text-white font-semibold transition cursor-pointer"
            >
              Inspect Attack Tree →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Active Target Assets */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Server className="w-4 h-4 text-[#6366F1]" />
              <span>Perimeter Targets</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">{labAssets.length} Active</span>
          </div>

          <div className="space-y-3.5">
            {labAssets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2 font-mono">
                <p className="text-xs">No assets mapped yet in this project.</p>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('ingest')}
                  className="text-xs text-[#6366F1] font-bold hover:underline cursor-pointer"
                >
                  Ingest Scans in Ingest Studio →
                </button>
              </div>
            ) : (
              labAssets.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-[#0B0F14] border border-[#1F2A37] rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-white font-mono">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.progress}% Risk</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#161F2C] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%`, backgroundColor: item.color }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{item.tech}</span>
                    <span className="text-slate-400">{item.status}</span>
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
        <div className="lg:col-span-2 bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Prioritized Attack Paths</span>
            </h3>

            <div className="flex items-center gap-1 bg-[#0B0F14] border border-[#1F2A37] p-1 rounded-lg text-xs font-mono">
              {(['all', 'active', 'verified'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTableFilter(f)}
                  className={`px-2.5 py-0.5 rounded capitalize text-[10px] transition cursor-pointer ${
                    tableFilter === f
                      ? 'bg-[#6366F1] text-white font-bold'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredChains.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2 font-mono">
                <p className="text-xs">No attack chains matched filter "{tableFilter}".</p>
                {chains.length === 0 && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('ingest')}
                    className="text-xs text-[#6366F1] font-bold hover:underline cursor-pointer"
                  >
                    Click here to ingest scanner telemetry →
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#0B0F14] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#1F2A37]">
                    <th className="py-2.5 px-3">ATTACK CHAIN</th>
                    <th className="py-2.5 px-3">PIVOT TARGET</th>
                    <th className="py-2.5 px-3">GAIN</th>
                    <th className="py-2.5 px-3">SCORE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2A37]">
                  {filteredChains.map((chain, idx) => (
                    <tr
                      key={chain.id || idx}
                      onClick={() => onSelectChain(chain.id)}
                      className="hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <td className="py-3 px-3 font-semibold text-white max-w-[220px] truncate">
                        {chain.title}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{getPivotTarget(chain)}</td>
                      <td className="py-3 px-3 text-indigo-400 font-bold">+{chain.chain_gain} Pts</td>
                      <td className="py-3 px-3 text-rose-400 font-bold">{chain.score}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            chain.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : chain.status === 'planned'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {chain.status === 'confirmed' ? 'Verified' : chain.status === 'planned' ? 'Planned' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-[#6366F1] hover:text-white font-semibold transition cursor-pointer">
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
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Crown Jewel Targets</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">{crownJewels.length} Target(s)</span>
          </div>

          <div className="space-y-2.5">
            {crownJewels.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-1 font-mono">
                <p className="text-xs">No crown jewel datastores identified.</p>
                <p className="text-[10px] text-slate-600">Internal databases will appear here.</p>
              </div>
            ) : (
              crownJewels.map((target, idx) => (
                <div key={target.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F14] border border-[#1F2A37] hover:border-[#2D3A4B] transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono font-bold flex items-center justify-center text-xs">
                      {target.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xs font-mono">{target.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{target.id} • {target.ip}</div>
                    </div>
                  </div>

                  <span className="bg-purple-500/10 text-purple-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-purple-500/30">
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
