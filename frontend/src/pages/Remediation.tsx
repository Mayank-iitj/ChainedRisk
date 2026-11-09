import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, ShieldCheck, Play, ArrowRight, Zap, Layers } from 'lucide-react';
import { RemediationItem, AttackChain } from '../types';
import { fetchRemediations, simulateFix } from '../api';

interface RemediationProps {
  projectId: string;
  chains: AttackChain[];
}

export const Remediation: React.FC<RemediationProps> = ({ projectId, chains }) => {
  const [remediations, setRemediations] = useState<RemediationItem[]>([]);
  const [selectedFixes, setSelectedFixes] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRemediations();
  }, [projectId]);

  const loadRemediations = async () => {
    const data = await fetchRemediations(projectId);
    setRemediations(data || []);
  };

  const toggleFix = async (findingId: string) => {
    const updated = selectedFixes.includes(findingId)
      ? selectedFixes.filter((id) => id !== findingId)
      : [...selectedFixes, findingId];

    setSelectedFixes(updated);

    if (updated.length > 0) {
      setLoading(true);
      try {
        const res = await simulateFix(projectId, updated);
        setSimResult(res);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setSimResult(null);
    }
  };

  return (
    <div className="space-y-6 pb-8 select-none">
      <div>
        <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
          <span className="text-white font-semibold">GRAPH THEORY</span> // MIN-CUT OPTIMIZATION
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-white" />
          <span>Graph-Theoretic Min-Cut Remediation</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5 font-mono">
          "Fix One, Break Many" — Compute the minimal bottleneck cut that disconnects 100% of attack paths to crown jewels.
        </p>
      </div>

      {/* Live Simulation Banner */}
      {simResult && (
        <div className="bg-black border border-white rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center font-mono">
            <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-white" />
              Live Graph Collapse Simulation
            </span>
            <span className="text-xs font-semibold bg-white text-black px-3 py-1 rounded-full">
              {simResult.chains_collapsed} of {simResult.original_chains_count} Chains Broken!
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-[#0A0A0A] p-3 rounded-xl border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">ORIGINAL ACTIVE CHAINS</span>
              <span className="text-white text-base font-bold">{simResult.original_chains_count}</span>
            </div>
            <div className="bg-[#0A0A0A] p-3 rounded-xl border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">SIMULATED CONTROLS</span>
              <span className="text-white text-base font-bold">{simResult.remediated_findings.length} Fixes</span>
            </div>
            <div className="bg-[#0A0A0A] p-3 rounded-xl border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">REMAINING RESIDUAL RISK</span>
              <span className="text-white text-base font-bold">{simResult.remaining_chains_count} Paths</span>
            </div>
          </div>
        </div>
      )}

      {/* Min-Cut Priority Table */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase font-mono">
            Optimal Defensive Bottlenecks (Ranked by Chains Broken)
          </h3>
          <span className="text-xs text-neutral-400 font-mono">Select checkboxes to simulate graph collapse</span>
        </div>

        <div className="space-y-3">
          {remediations.map((item) => {
            const isSelected = selectedFixes.includes(item.finding_id);
            return (
              <div
                key={item.finding_id}
                className={`p-4 rounded-xl border transition ${
                  isSelected
                    ? 'bg-black border-2 border-white'
                    : 'bg-black border border-[#262626] hover:border-neutral-500'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFix(item.finding_id)}
                      className="w-4 h-4 rounded border-neutral-600 bg-black accent-white focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white font-bold text-xs">{item.action}</span>
                        <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded">
                          Breaks {item.breaks_chains_count} Chains
                        </span>
                        <span className="bg-black text-neutral-400 border border-[#262626] text-[10px] font-medium px-2 py-0.5 rounded">
                          Effort: {item.effort}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 font-mono">
                        Target Finding: <span className="text-white font-semibold">{item.finding_id} ({item.title})</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-white font-bold block text-sm">-{item.risk_eliminated} Pts</span>
                    <span className="text-neutral-500 text-[10px] uppercase">Risk Cut</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
