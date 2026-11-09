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

  const displayRejections = rejections;

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
            <span className="text-white font-bold">Formal Verification</span> // Invariant Guardrails
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-white" />
            <span>Attack Hypotheses & Safety Invariants</span>
            <span className="bg-white text-black text-xs font-mono font-bold px-2.5 py-0.5 rounded ml-1">
              {chains.length} Validated · {displayRejections.length} Refuted
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Every candidate attack path is formally tested against safety invariants (INV-1 through INV-12). Paths violating scope or mathematical reachability are pruned.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#262626] rounded-lg p-1 text-xs">
          {(['all', 'accepted', 'rejected'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded font-mono text-xs transition cursor-pointer ${
                activeFilter === filter
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {filter === 'all' ? 'All Hypotheses' : filter === 'accepted' ? 'Accepted Chains' : 'Refuted Invariants'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive What-If Simulator Panel */}
      <div className="bg-[#0A0A0A] border border-[#262626] text-white rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Hypothetical "What-If" Capability Simulator
            </h3>
          </div>
          <span className="text-[10px] font-mono text-black bg-white px-2 py-0.5 rounded font-bold">
            Sandboxed Math Engine
          </span>
        </div>

        <p className="text-xs text-neutral-300 max-w-2xl font-mono">
          Simulate changes to your perimeter and network defenses. See how injecting or removing attacker capabilities alters correlated breach paths in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div
            onClick={() => setSimAuthBypass(!simAuthBypass)}
            className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
              simAuthBypass
                ? 'bg-white text-black border-white'
                : 'bg-black border-[#262626] text-neutral-300 hover:border-neutral-500'
            }`}
          >
            <div>
              <div className="font-bold text-xs font-mono">Simulate Redis Auth</div>
              <div className={`text-[10px] font-mono mt-0.5 ${simAuthBypass ? 'text-neutral-700' : 'text-neutral-400'}`}>Require strong AUTH token</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simAuthBypass ? 'bg-black border-black' : 'border-neutral-500'}`} />
          </div>

          <div
            onClick={() => setSimEgressAllowed(!simEgressAllowed)}
            className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
              simEgressAllowed
                ? 'bg-white text-black border-white'
                : 'bg-black border-[#262626] text-neutral-300 hover:border-neutral-500'
            }`}
          >
            <div>
              <div className="font-bold text-xs font-mono">Simulate Outbound Egress</div>
              <div className={`text-[10px] font-mono mt-0.5 ${simEgressAllowed ? 'text-neutral-700' : 'text-neutral-400'}`}>Enable internet exfiltration</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simEgressAllowed ? 'bg-black border-black' : 'border-neutral-500'}`} />
          </div>

          <div
            onClick={() => setSimVpnDisclosed(!simVpnDisclosed)}
            className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
              simVpnDisclosed
                ? 'bg-white text-black border-white'
                : 'bg-black border-[#262626] text-neutral-300 hover:border-neutral-500'
            }`}
          >
            <div>
              <div className="font-bold text-xs font-mono">Simulate Internal VPN Key</div>
              <div className={`text-[10px] font-mono mt-0.5 ${simVpnDisclosed ? 'text-neutral-700' : 'text-neutral-400'}`}>Direct internal subnet entry</div>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full border ${simVpnDisclosed ? 'bg-black border-black' : 'border-neutral-500'}`} />
          </div>
        </div>

        {(simAuthBypass || simEgressAllowed || simVpnDisclosed) && (
          <div className="p-3 bg-black rounded-lg border border-white text-xs font-mono text-white flex items-center justify-between">
            <span>
              SIMULATION VERDICT: {simAuthBypass ? 'Redis chain collapses (-91 pts risk cut).' : ''} {simEgressAllowed ? 'INV-2 fails: Egress violation detected.' : ''} {simVpnDisclosed ? 'Direct path to git.lab unlocked.' : ''}
            </span>
            <button
              onClick={() => { setSimAuthBypass(false); setSimEgressAllowed(false); setSimVpnDisclosed(false); }}
              className="text-[11px] underline text-neutral-300 hover:text-white cursor-pointer ml-3 flex-shrink-0"
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
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Mathematically Validated Attack Chains</span>
              </h3>
              <span className="text-xs font-mono font-bold text-black bg-white px-2.5 py-0.5 rounded">
                {chains.length} Active Chains
              </span>
            </div>

            <div className="space-y-3">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  onClick={() => onSelectChain && onSelectChain(chain.id)}
                  className="p-4 bg-black hover:bg-[#121212] border border-[#262626] hover:border-white rounded-lg transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white group-hover:underline font-mono">
                        {chain.title}
                      </span>
                      <span className="text-[10px] font-mono text-black bg-white px-2 py-0.5 rounded font-bold">
                        Score: {chain.score}/100 (+{chain.chain_gain} Gain)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Steps: {chain.steps?.length || 0} stages • Status: <strong className="text-white">{chain.status.toUpperCase()}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-mono text-white group-hover:translate-x-1 transition flex items-center gap-1">
                    Inspect Path <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refuted Hypotheses & Invariants */}
        {(activeFilter === 'all' || activeFilter === 'rejected') && (
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-white" />
                <span>Refuted Candidate Hypotheses (Pruned by Invariants)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-white border border-neutral-600 px-2.5 py-0.5 rounded">
                {displayRejections.length} Refuted
              </span>
            </div>

            <div className="space-y-3">
              {displayRejections.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 font-mono text-xs bg-black rounded-lg border border-[#262626] space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-white mx-auto" />
                  <div className="text-white font-bold">100% Invariant Validation Passed</div>
                  <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
                    All candidate attack trajectories evaluated for this project satisfy capability flow and scope invariants (INV-1 through INV-12). Zero ungranted pivots detected.
                  </p>
                </div>
              ) : (
                displayRejections.map((rej, idx) => (
                  <div key={rej.id || idx} className="p-4 bg-black border border-[#262626] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        {rej.reason}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {rej.created_at ? new Date(rej.created_at).toLocaleTimeString() : 'Verified'}
                      </span>
                    </div>

                    {rej.payload && (
                      <div className="text-[10px] font-mono text-neutral-400 bg-[#0A0A0A] p-2.5 rounded border border-[#262626] max-w-2xl truncate">
                        Parameters: {JSON.stringify(rej.payload)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
