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
  ExternalLink
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
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);

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
    <div className="space-y-6 pb-8">
      {/* Breadcrumb & Action Banner */}
      <div className="reveal-block flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#64748b]">
            <span className="text-[#6366f1] font-bold">{orgName || 'Workspace'}</span> / {projectName || 'Risk Correlation & Attack Paths'}
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5">
            Security Overview
          </h2>
        </div>

        <button
          onClick={onLoadDemo}
          disabled={loading}
          className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-[#6366f1]/25 transition cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{loading ? 'LOADING...' : 'LOAD DEMO LAB SCENARIO'}</span>
        </button>
      </div>

      {/* Top 5 Metric Cards (Matching Screenshot) */}
      <div className="reveal-block grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-4 shadow-card hover:shadow-card-hover transition">
          <div className="flex justify-between items-center text-xs text-[#64748b] font-medium">
            <span>Total Findings</span>
            <span className="p-1.5 rounded-lg border border-[#f1f5f9] text-[#94a3b8]">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2 tracking-tight">
            {stats?.findings ?? 0}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-md w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>Ingested from lab scans</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-4 shadow-card hover:shadow-card-hover transition">
          <div className="flex justify-between items-center text-xs text-[#64748b] font-medium">
            <span>Noise Reduction</span>
            <span className="p-1.5 rounded-lg border border-[#f1f5f9] text-[#94a3b8]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2 tracking-tight">
            {stats?.noise_reduction_percent ?? 0}%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#ef4444] bg-[#fef2f2] px-2 py-0.5 rounded-md w-fit">
            <TrendingDown className="w-3 h-3" />
            <span>-{stats?.noise_reduction_percent ?? 0}% alert fatigue</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-4 shadow-card hover:shadow-card-hover transition">
          <div className="flex justify-between items-center text-xs text-[#64748b] font-medium">
            <span>Attack Paths</span>
            <span className="p-1.5 rounded-lg border border-[#f1f5f9] text-[#94a3b8]">
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2 tracking-tight">
            {chains.length}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-md w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>Multi-hop correlated</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-4 shadow-card hover:shadow-card-hover transition">
          <div className="flex justify-between items-center text-xs text-[#64748b] font-medium">
            <span>Critical Score</span>
            <span className="p-1.5 rounded-lg border border-[#f1f5f9] text-[#94a3b8]">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2 tracking-tight">
            {topChain?.score ?? 0}/100
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#ef4444] bg-[#fef2f2] px-2 py-0.5 rounded-md w-fit">
            <TrendingDown className="w-3 h-3" />
            <span>{topChain?.severity ? `${topChain.severity.toUpperCase()} severity` : 'Pending scan'}</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-4 shadow-card hover:shadow-card-hover transition">
          <div className="flex justify-between items-center text-xs text-[#64748b] font-medium">
            <span>Verified in Lab</span>
            <span className="p-1.5 rounded-lg border border-[#f1f5f9] text-[#94a3b8]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2 tracking-tight">
            {stats?.verified_chains ?? 0}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-md w-fit">
            <TrendingUp className="w-3 h-3" />
            <span>HITL sandbox validated</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Severity Illusion Curve (Balance Overview) + Active Target Projects */}
      <div className="reveal-block grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Severity Illusion Chart */}
        <div className="lg:col-span-2 bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold text-[#0f172a]">
                Severity Illusion & Attack Trajectory
              </h3>
              <div className="flex items-center gap-4 text-xs mt-1 text-[#64748b]">
                <span className="flex items-center gap-1.5 font-bold text-[#0f172a]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  Chain Risk: {topChain?.score ?? 91} (Critical)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  Max Isolated Finding: 50 (Medium)
                </span>
              </div>
            </div>

            {/* Filter Pills matching screenshot */}
            <div className="flex items-center gap-1 bg-[#f8fafc] border border-[#eef2f6] p-1 rounded-xl text-xs font-semibold">
              {(['all', '1m', '6m', '1y'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 py-1 rounded-lg transition uppercase text-[11px] cursor-pointer ${
                    timeFilter === filter
                      ? 'bg-[#6366f1] text-white shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Smooth Curve Graph matching screenshot */}
          <div className="relative w-full h-56 pt-2">
            <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
              {/* Horizontal Gridlines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" />

              {/* Red line (Expenses / Isolated Findings) */}
              <path
                d="M 0 100 C 50 110, 100 120, 150 115 C 200 110, 250 85, 300 85 C 350 85, 400 95, 450 95 C 500 95, 550 80, 600 70"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
              />

              {/* Green line (Chain Risk Surge) */}
              <path
                d="M 0 130 C 50 120, 100 110, 150 112 C 200 114, 250 105, 300 90 C 350 75, 400 90, 450 70 C 500 50, 550 35, 600 25"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Pin indicator marker */}
              <circle cx="300" cy="90" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <rect x="310" y="70" width="75" height="24" rx="6" fill="#10b981" />
              <text x="347" y="86" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                +{topChain?.chain_gain ?? 40} Gain
              </text>
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono mt-1 px-1">
              <span>Step 1: Recon</span>
              <span>Step 2: .git Config</span>
              <span>Step 3: SSRF Proxy</span>
              <span>Step 4: Pivot</span>
              <span>Step 5: Redis 6379</span>
              <span>Verdict: Critical RCE</span>
            </div>
          </div>

          <div className="p-3 bg-[#f8fafc] border border-[#eef2f6] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#475569]">
              Correlation Insight: Isolated Low/Medium alerts surge to <strong className="text-[#ef4444]">Critical {topChain?.score ?? 90}</strong> when chained through the SSRF pivot.
            </span>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('chains') : onSelectChain(topChain?.id || '')}
              className="font-bold text-[#6366f1] hover:underline cursor-pointer text-xs"
            >
              Inspect Attack Tree →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Active Target Assets */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-[#0f172a]">Active Lab Assets</h3>
            <span className="text-[11px] font-mono text-[#64748b]">{labAssets.length} Total</span>
          </div>

          <div className="space-y-4">
            {labAssets.length === 0 ? (
              <div className="py-8 text-center text-[#64748b] space-y-2">
                <p className="text-xs">No assets mapped yet in this project.</p>
                <button
                  onClick={() => onNavigateTab ? onNavigateTab('ingest') : onLoadDemo()}
                  className="text-xs text-[#6366f1] font-bold hover:underline cursor-pointer"
                >
                  Ingest Scans in Ingest Studio →
                </button>
              </div>
            ) : (
              labAssets.map((item, idx) => (
                <div key={item.id || idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-[#0f172a]">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#64748b]">{item.progress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%`, backgroundColor: item.color }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[10px] text-[#94a3b8]">
                    <span>{item.tech}</span>
                    <span className="font-mono">{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders (Chains Table) + Top Customer (Crown Jewels) */}
      <div className="reveal-block grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bottom Left 2 Cols: Attack Chains Table (Recent Orders in screenshot) */}
        <div className="lg:col-span-2 bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-[#0f172a]">
              Prioritized Breach Paths
            </h3>

            <div className="flex items-center gap-1 bg-[#f8fafc] border border-[#eef2f6] p-1 rounded-xl text-xs font-semibold">
              {(['all', 'active', 'verified'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTableFilter(f)}
                  className={`px-3 py-1 rounded-lg transition capitalize text-[11px] cursor-pointer ${
                    tableFilter === f
                      ? 'bg-[#6366f1] text-white shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredChains.length === 0 ? (
              <div className="p-8 text-center text-[#64748b] space-y-2">
                <p className="text-xs">No attack chains matched filter "{tableFilter}".</p>
                {chains.length === 0 && (
                  <button
                    onClick={onLoadDemo}
                    className="text-xs text-[#6366f1] font-bold hover:underline cursor-pointer"
                  >
                    Click here to load demo attack scenario →
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-[11px] font-semibold border-b border-[#eef2f6]">
                    <th className="py-2.5 px-3 rounded-l-lg">ATTACK CHAIN</th>
                    <th className="py-2.5 px-3">PIVOT TARGET</th>
                    <th className="py-2.5 px-3">CHAIN GAIN</th>
                    <th className="py-2.5 px-3">SCORE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {filteredChains.map((chain, idx) => (
                    <tr
                      key={chain.id || idx}
                      onClick={() => onSelectChain(chain.id)}
                      className="hover:bg-[#f8fafc] transition cursor-pointer"
                    >
                      <td className="py-3 px-3 font-bold text-[#0f172a] max-w-[200px] truncate">
                        {chain.title}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#64748b]">{getPivotTarget(chain)}</td>
                      <td className="py-3 px-3 font-semibold text-[#6366f1]">+{chain.chain_gain} Pts</td>
                      <td className="py-3 px-3 font-black text-[#0f172a]">{chain.score}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            chain.status === 'confirmed'
                              ? 'bg-[#ecfdf5] text-[#10b981]'
                              : chain.status === 'planned'
                              ? 'bg-[#eff6ff] text-[#3b82f6]'
                              : 'bg-[#fffbeb] text-[#d97706]'
                          }`}
                        >
                          {chain.status === 'confirmed' ? 'Verified' : chain.status === 'planned' ? 'Planned' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-[#6366f1] font-bold hover:underline cursor-pointer">
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bottom Right 1 Col: Crown Jewels / High-Value Targets */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-[#0f172a]">Crown Jewel Targets</h3>
            <span className="text-[11px] font-mono text-[#64748b]">{crownJewels.length} Identified</span>
          </div>

          <div className="space-y-3">
            {crownJewels.length === 0 ? (
              <div className="py-8 text-center text-[#64748b] space-y-1">
                <p className="text-xs">No crown jewel datastores identified.</p>
                <p className="text-[10px] text-slate-400">Datastores and internal crown jewels will be automatically mapped here.</p>
              </div>
            ) : (
              crownJewels.map((target, idx) => (
                <div key={target.id || idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f1f5f9] text-[#6366f1] font-bold flex items-center justify-center text-xs">
                      {target.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#0f172a] text-xs">{target.name}</div>
                      <div className="text-[10px] text-[#94a3b8] font-mono">{target.id} • {target.ip}</div>
                    </div>
                  </div>

                  <span className="bg-[#fef2f2] text-[#ef4444] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#fecaca]">
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
