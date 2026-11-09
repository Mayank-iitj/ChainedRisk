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
      <div className="reveal-block">
        <div className="text-[11px] font-mono tracking-wider text-[#64748B] uppercase">
          <span className="text-[#6366F1] font-semibold">GRAPH THEORY</span> // MIN-CUT OPTIMIZATION
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#6366F1]" />
          <span>Graph-Theoretic Min-Cut Remediation</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5 font-mono">
          "Fix One, Break Many" — Compute the minimal bottleneck cut that disconnects 100% of attack paths to crown jewels.
        </p>
      </div>

      {/* Live Simulation Banner */}
      {simResult && (
        <div className="reveal-block bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex justify-between items-center font-mono">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Live Graph Collapse Simulation
            </span>
            <span className="text-xs font-semibold bg-[#0B0F14] text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              {simResult.chains_collapsed} of {simResult.original_chains_count} Chains Broken!
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-[#0B0F14] p-3 rounded-xl border border-[#1F2A37]">
              <span className="text-slate-500 block text-[10px] uppercase">ORIGINAL ACTIVE CHAINS</span>
              <span className="text-white text-base font-bold">{simResult.original_chains_count}</span>
            </div>
            <div className="bg-[#0B0F14] p-3 rounded-xl border border-[#1F2A37]">
              <span className="text-slate-500 block text-[10px] uppercase">SIMULATED CONTROLS</span>
              <span className="text-[#6366F1] text-base font-bold">{simResult.remediated_findings.length} Fixes</span>
            </div>
            <div className="bg-[#0B0F14] p-3 rounded-xl border border-[#1F2A37]">
              <span className="text-slate-500 block text-[10px] uppercase">REMAINING RESIDUAL RISK</span>
              <span className="text-emerald-400 text-base font-bold">{simResult.remaining_chains_count} Paths</span>
            </div>
          </div>
        </div>
      )}

      {/* Min-Cut Priority Table */}
      <div className="reveal-block bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase font-mono">
            Optimal Defensive Bottlenecks (Ranked by Chains Broken)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Select checkboxes to simulate graph collapse</span>
        </div>

        <div className="space-y-3">
          {remediations.map((item) => {
            const isSelected = selectedFixes.includes(item.finding_id);
            return (
              <div
                key={item.finding_id}
                className={`p-4 rounded-xl border transition ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-glow-emerald'
                    : 'bg-[#0B0F14] border-[#1F2A37] hover:border-[#2D3A4B]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFix(item.finding_id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#6366F1] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white font-bold text-xs">{item.action}</span>
                        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold px-2 py-0.5 rounded">
                          Breaks {item.breaks_chains_count} Chains
                        </span>
                        <span className="bg-[#121821] text-slate-400 border border-[#1F2A37] text-[10px] font-medium px-2 py-0.5 rounded">
                          Effort: {item.effort}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Target Finding: <span className="text-slate-300 font-semibold">{item.finding_id} ({item.title})</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-emerald-400 font-bold block text-sm">-{item.risk_eliminated} Pts</span>
                    <span className="text-slate-500 text-[10px] uppercase">Risk Cut</span>
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
