import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, ShieldCheck, Play, ArrowRight, Zap } from 'lucide-react';
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
    setRemediations(data);
  };

  const toggleFix = async (findingId: string) => {
    const updated = selectedFixes.includes(findingId)
      ? selectedFixes.filter((id) => id !== findingId)
      : [...selectedFixes, findingId];

    setSelectedFixes(updated);

    if (updated.length > 0) {
      setLoading(true);
      const res = await simulateFix(projectId, updated);
      setSimResult(res);
      setLoading(false);
    } else {
      setSimResult(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="reveal-block">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-600" />
          <span>Graph-Theoretic Min-Cut Remediation</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          "Fix One, Break Many" — Compute the minimal set of defenses that disconnects all attacker paths to crown jewels.
        </p>
      </div>

      {/* Live Simulation Banner */}
      {simResult && (
        <div className="reveal-block bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Live Remediation Simulation
            </span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full">
              {simResult.chains_collapsed} of {simResult.original_chains_count} Chains Broken!
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
              <span className="text-slate-500 block text-[10px]">CURRENT ACTIVE CHAINS</span>
              <span className="text-slate-800 text-base font-bold">{simResult.original_chains_count}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
              <span className="text-slate-500 block text-[10px]">SIMULATED FIXES APPLIED</span>
              <span className="text-indigo-600 text-base font-bold">{simResult.remediated_findings.length} Controls</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
              <span className="text-slate-500 block text-[10px]">REMAINING ACTIVE RISK</span>
              <span className="text-emerald-700 text-base font-bold">{simResult.remaining_chains_count} Paths</span>
            </div>
          </div>
        </div>
      )}

      {/* Min-Cut Priority Table */}
      <div className="reveal-block bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Optimal Defenses (Ranked by Chains Broken)</h3>
          <span className="text-xs text-slate-500">Select checkboxes to simulate live collapse</span>
        </div>

        <div className="space-y-3">
          {remediations.map((item) => {
            const isSelected = selectedFixes.includes(item.finding_id);
            return (
              <div
                key={item.finding_id}
                className={`p-4 rounded-xl border transition ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFix(item.finding_id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 font-bold text-sm">{item.action}</span>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          Breaks {item.breaks_chains_count} Chains
                        </span>
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded">
                          Effort: {item.effort}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        Target Finding: <span className="text-slate-700 font-medium">{item.finding_id} ({item.title})</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-emerald-600 font-bold block text-sm">-{item.risk_eliminated} Pts</span>
                    <span className="text-slate-400 text-[10px]">Risk Cut</span>
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
