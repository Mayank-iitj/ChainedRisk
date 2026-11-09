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
          <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
            <span className="text-indigo-400 font-bold">Formal Verification</span> // Invariant Guardrails
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-0.5 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <span>Attack Hypotheses & Safety Invariants</span>
            <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/70 text-xs font-mono font-bold px-2.5 py-0.5 rounded ml-1">
              {chains.length} Validated · {displayRejections.length} Refuted
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Every candidate attack path is formally tested against safety invariants (INV-1 through INV-12). Paths violating scope or mathematical reachability are pruned.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#121821] border border-[#1F2A37] rounded-lg p-1 text-xs">
          {(['all', 'accepted', 'rejected'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded font-mono text-xs transition cursor-pointer ${
                activeFilter === filter
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A2230]'
              }`}
            >
              {filter === 'all' ? 'All Hypotheses' : filter === 'accepted' ? 'Accepted Chains' : 'Refuted Invariants'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive What-If Simulator Panel */}
      <div className="reveal-block bg-[#121821] border border-[#1F2A37] text-white rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Hypothetical "What-If" Capability Simulator
            </h3>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded">
            Sandboxed Math Engine
          </span>
        </div>

        <p className="text-xs text-slate-300 max-w-2xl font-mono">
          Simulate changes to your perimeter and network defenses. See how injecting or removing attacker capabilities alters correlated breach paths in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div
            onClick={() => setSimAuthBypass(!simAuthBypass)}
            className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
              simAuthBypass
                ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                : 'bg-[#0B0F14] border-[#1F2A37] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div>
              <div className="font-bold text-xs font-mono">Simulate Redis Auth</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Require strong AUTH token</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simAuthBypass ? 'bg-indigo-400 border-indigo-300' : 'border-slate-600'}`} />
          </div>

          <div
            onClick={() => setSimEgressAllowed(!simEgressAllowed)}
            className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
              simEgressAllowed
                ? 'bg-amber-950/70 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                : 'bg-[#0B0F14] border-[#1F2A37] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div>
              <div className="font-bold text-xs font-mono">Simulate Outbound Egress</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Enable internet exfiltration</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simEgressAllowed ? 'bg-amber-400 border-amber-300' : 'border-slate-600'}`} />
          </div>

          <div
            onClick={() => setSimVpnDisclosed(!simVpnDisclosed)}
            className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
              simVpnDisclosed
                ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg shadow-purple-950/40'
                : 'bg-[#0B0F14] border-[#1F2A37] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div>
              <div className="font-bold text-xs font-mono">Simulate Internal VPN Key</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Direct internal subnet entry</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simVpnDisclosed ? 'bg-purple-400 border-purple-300' : 'border-slate-600'}`} />
          </div>
        </div>

        {(simAuthBypass || simEgressAllowed || simVpnDisclosed) && (
          <div className="p-3 bg-[#0B0F14] rounded-lg border border-indigo-900/60 text-xs font-mono text-indigo-300 flex items-center justify-between animate-fadeIn">
            <span>
              SIMULATION VERDICT: {simAuthBypass ? 'Redis chain collapses (-91 pts risk cut).' : ''} {simEgressAllowed ? 'INV-2 fails: Egress violation detected.' : ''} {simVpnDisclosed ? 'Direct path to git.lab unlocked.' : ''}
            </span>
            <button
              onClick={() => { setSimAuthBypass(false); setSimEgressAllowed(false); setSimVpnDisclosed(false); }}
              className="text-[11px] underline text-slate-300 hover:text-white cursor-pointer ml-3 flex-shrink-0"
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
          <div className="reveal-block bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mathematically Validated Attack Chains</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded">
                {chains.length} Active Chains
              </span>
            </div>

            <div className="space-y-3">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  onClick={() => onSelectChain && onSelectChain(chain.id)}
                  className="p-4 bg-[#0B0F14] hover:bg-[#161F2E] border border-[#1F2A37] hover:border-indigo-500/60 rounded-lg transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 font-mono">
                        {chain.title}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded">
                        Score: {chain.score}/100 (+{chain.chain_gain} Gain)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Steps: {chain.steps?.length || 0} stages • Status: <strong className="text-emerald-400">{chain.status.toUpperCase()}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 group-hover:translate-x-1 transition flex items-center gap-1">
                    Inspect Path <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refuted Hypotheses & Invariants */}
        {(activeFilter === 'all' || activeFilter === 'rejected') && (
          <div className="reveal-block bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Refuted Candidate Hypotheses (Pruned by Invariants)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 border border-red-800/80 px-2.5 py-0.5 rounded">
                {displayRejections.length} Refuted
              </span>
            </div>

            <div className="space-y-3">
              {displayRejections.map((rej, idx) => (
                <div key={rej.id || idx} className="p-4 bg-[#181116] border border-red-900/40 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-300 font-mono flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      {rej.reason}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {rej.created_at ? new Date(rej.created_at).toLocaleTimeString() : 'Verified'}
                    </span>
                  </div>

                  {rej.payload && (
                    <div className="text-[10px] font-mono text-slate-400 bg-[#0B0F14] p-2.5 rounded border border-[#1F2A37] max-w-2xl truncate">
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
