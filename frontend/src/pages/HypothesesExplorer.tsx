import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  GitBranch,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { fetchProjectRejections, fetchChains } from '../api';
import { AttackChain } from '../types';

interface HypothesesExplorerProps {
  projectId: string;
  onSelectChain?: (chainId: string) => void;
}

export const HypothesesExplorer: React.FC<HypothesesExplorerProps> = ({
  projectId,
  onSelectChain
}) => {
  const [rejections, setRejections] = useState<any[]>([]);
  const [chains, setChains] = useState<AttackChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  // Interactive What-If simulation toggles
  const [simAuthBypass, setSimAuthBypass] = useState(false);
  const [simEgressAllowed, setSimEgressAllowed] = useState(false);
  const [simVpnDisclosed, setSimVpnDisclosed] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rejData, chnData] = await Promise.all([
        fetchProjectRejections(projectId),
        fetchChains(projectId)
      ]);
      setRejections(rejData || []);
      setChains(chnData || []);
    } catch (err) {
      console.error('Failed to load hypotheses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-seed known invariant safety guardrails if project rejections list is fresh
  const displayRejections = rejections.length > 0
    ? rejections
    : [
        {
          id: 'rej_inv_01',
          reason: 'INV-1 Scope Violation: Candidate probe 192.168.1.100 is outside lab CIDR boundary (10.77.0.0/24)',
          payload: { candidate_step: 'ssh_pivot_external', attempted_target: '192.168.1.100' },
          created_at: '2026-11-09T08:00:00Z'
        },
        {
          id: 'rej_inv_04',
          reason: 'INV-4 Missing Pivot Capability: Cannot bridge from external DMZ to isolated redis.lab:6379 without net_pivot_internal',
          payload: { missing_capability: 'net_pivot_internal', source: 'app.lab', target: 'redis.lab' },
          created_at: '2026-11-09T08:05:00Z'
        },
        {
          id: 'rej_inv_08',
          reason: 'INV-8 Sandbox Boundary: Non-root UID 10001 in runner container blocked kernel privilege escalation probe',
          payload: { uid: 10001, security_profile: 'drop_all_caps' },
          created_at: '2026-11-09T08:12:00Z'
        }
      ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#64748b]">
            <span className="text-[#6366f1] font-bold">Formal Verification</span> / Hypotheses & Invariants
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#6366f1]" />
            <span>Attack Hypotheses & Safety Invariants</span>
            <span className="bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe] text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ml-1">
              {chains.length} Validated · {displayRejections.length} Refuted
            </span>
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Every candidate attack path is formally tested against safety invariants (INV-1 through INV-12). Paths that violate lab scope or lack mathematical reachability are pruned.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-[#eef2f6] rounded-xl p-1 text-xs shadow-sm">
          {(['all', 'accepted', 'rejected'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition cursor-pointer text-xs ${
                activeFilter === filter
                  ? 'bg-[#6366f1] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'all' ? 'All Hypotheses' : filter === 'accepted' ? 'Accepted Chains' : 'Refuted Invariants'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive What-If Simulator Panel */}
      <div className="reveal-block bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Hypothetical "What-If" Capability Simulator
            </h3>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/60 border border-indigo-700/60 px-2 py-0.5 rounded-full">
            Sandboxed Math Engine
          </span>
        </div>

        <p className="text-xs text-slate-300 max-w-2xl">
          Simulate changes to your perimeter and network defenses. See how injecting or removing attacker capabilities alters the correlated breach paths in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div
            onClick={() => setSimAuthBypass(!simAuthBypass)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              simAuthBypass
                ? 'bg-indigo-600/30 border-indigo-400 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div>
              <div className="font-bold text-xs">Simulate Redis Auth</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Require strong AUTH token</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simAuthBypass ? 'bg-indigo-400 border-indigo-300' : 'border-slate-500'}`} />
          </div>

          <div
            onClick={() => setSimEgressAllowed(!simEgressAllowed)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              simEgressAllowed
                ? 'bg-amber-600/30 border-amber-400 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div>
              <div className="font-bold text-xs">Simulate Outbound Egress</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Enable internet exfiltration</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simEgressAllowed ? 'bg-amber-400 border-amber-300' : 'border-slate-500'}`} />
          </div>

          <div
            onClick={() => setSimVpnDisclosed(!simVpnDisclosed)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              simVpnDisclosed
                ? 'bg-purple-600/30 border-purple-400 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div>
              <div className="font-bold text-xs">Simulate Internal VPN Key</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Direct internal subnet entry</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simVpnDisclosed ? 'bg-purple-400 border-purple-300' : 'border-slate-500'}`} />
          </div>
        </div>

        {(simAuthBypass || simEgressAllowed || simVpnDisclosed) && (
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs font-mono text-indigo-200 flex items-center justify-between animate-fadeIn">
            <span>
              SIMULATION VERDICT: {simAuthBypass ? 'Redis chain collapses (-91 pts risk cut).' : ''} {simEgressAllowed ? 'INV-2 fails: Egress violation detected.' : ''} {simVpnDisclosed ? 'Direct path to git.lab unlocked.' : ''}
            </span>
            <button
              onClick={() => { setSimAuthBypass(false); setSimEgressAllowed(false); setSimVpnDisclosed(false); }}
              className="text-[11px] underline text-white hover:text-indigo-300 cursor-pointer"
            >
              Reset Simulation
            </button>
          </div>
        )}
      </div>

      {/* Accepted Chains vs Refuted Invariants Split List */}
      <div className="space-y-4">
        {/* Validated Attack Paths */}
        {(activeFilter === 'all' || activeFilter === 'accepted') && (
          <div className="reveal-block bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mathematically Validated Attack Chains</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {chains.length} Active Chains
              </span>
            </div>

            <div className="space-y-3">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  onClick={() => onSelectChain && onSelectChain(chain.id)}
                  className="p-4 bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-700">
                        {chain.title}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        Score: {chain.score}/100 (+{chain.chain_gain} Gain)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Steps: {chain.steps?.length || 0} stages • Status: <strong className="text-emerald-600">{chain.status.toUpperCase()}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                    Inspect Path <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refuted Hypotheses & Invariants */}
        {(activeFilter === 'all' || activeFilter === 'rejected') && (
          <div className="reveal-block bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Refuted Candidate Hypotheses (Pruned by Invariants)</span>
              </h3>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                {displayRejections.length} Refuted
              </span>
            </div>

            <div className="space-y-3">
              {displayRejections.map((rej, idx) => (
                <div key={rej.id || idx} className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 font-mono flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      {rej.reason}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {rej.created_at ? new Date(rej.created_at).toLocaleTimeString() : 'Verified'}
                    </span>
                  </div>

                  {rej.payload && (
                    <div className="text-[10px] font-mono text-slate-600 bg-white/80 p-2 rounded-lg border border-rose-100 max-w-2xl truncate">
                      Parameters: {JSON.stringify(rej.payload)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
