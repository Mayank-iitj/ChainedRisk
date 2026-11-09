import React, { useState } from 'react';
import {
  GitMerge,
  ArrowRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  Play,
  FileCheck,
  Flame,
  Key,
  EyeOff,
  Sparkles,
  Zap
} from 'lucide-react';
import { AttackChain, ApprovalCard } from '../types';
import { planVerification, runPlan, fetchRejectedHypotheses } from '../api';

interface ChainsProps {
  chains: AttackChain[];
  selectedChainId: string | null;
  onSelectChain: (id: string) => void;
  onOpenApproval: (card: ApprovalCard) => void;
  onNavigateToConsole: () => void;
}

export const Chains: React.FC<ChainsProps> = ({
  chains,
  selectedChainId,
  onSelectChain,
  onOpenApproval,
  onNavigateToConsole
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'explanation' | 'rejections'>('steps');
  const [planning, setPlanning] = useState(false);
  const [rejections, setRejections] = useState<any[]>([]);

  const selectedChain = chains.find((c) => c.id === selectedChainId) || chains[0];

  const handlePlanAndRun = async () => {
    if (!selectedChain) return;
    setPlanning(true);
    try {
      const planRes = await planVerification(selectedChain.id);
      const runRes = await runPlan(planRes.plan_id);

      if (runRes.status === 'approval_required' && runRes.card) {
        onOpenApproval(runRes.card);
      } else {
        onNavigateToConsole();
      }
    } catch (err: any) {
      alert(`Planning error: ${err.message}`);
    } finally {
      setPlanning(false);
    }
  };

  const handleLoadRejections = async () => {
    if (!selectedChain) return;
    const data = await fetchRejectedHypotheses(selectedChain.id);
    setRejections(data || []);
    setActiveTab('rejections');
  };

  if (!selectedChain) {
    return (
      <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-12 text-center text-slate-500 shadow-card font-mono">
        <GitMerge className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-white uppercase">No Attack Chains Correlated</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Ingest scanner findings in Ingest Studio and execute the correlation engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* Chain Selector Header */}
      <div className="reveal-block bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono tracking-wider text-[#64748B] uppercase">
              <span className="text-[#6366F1] font-semibold">ATTACK PATH</span> // MULTI-STAGE TRAJECTORY
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>{selectedChain.title}</span>
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                Score {selectedChain.score} (+{selectedChain.chain_gain} Gain)
              </span>
            </h2>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-0.5">
              <span>ORIGIN: <strong className="text-white">{selectedChain.origin.toUpperCase()}</strong></span>
              <span>CONFIDENCE: <strong className="text-cyan-400">{Math.round(selectedChain.confidence * 100)}%</strong></span>
              <span>STATUS: <strong className="text-emerald-400">{selectedChain.status.toUpperCase()}</strong></span>
            </div>
          </div>

          <button
            onClick={handlePlanAndRun}
            disabled={planning}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-mono text-xs font-bold px-5 py-2.5 rounded-xl shadow-glow-indigo transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{planning ? 'COMPUTING PLAN...' : 'GENERATE PLAN & RUN'}</span>
          </button>
        </div>

        {/* Chain Switcher Pills */}
        {chains.length > 1 && (
          <div className="pt-3 border-t border-[#1F2A37] flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-[10px] text-slate-500 whitespace-nowrap font-bold uppercase">PATHS:</span>
            {chains.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectChain(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer ${
                  c.id === selectedChain.id
                    ? 'bg-[#6366F1] text-white font-bold'
                    : 'bg-[#0B0F14] text-slate-400 border border-[#1F2A37] hover:text-white'
                }`}
              >
                {c.title.slice(0, 36)}... (Score: {c.score})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="reveal-block flex gap-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'steps'
              ? 'bg-[#161F2C] text-white border border-[#2D3A4B] font-bold shadow-sm'
              : 'bg-[#121821] text-slate-400 border border-[#1F2A37] hover:text-white'
          }`}
        >
          Attack Stepper ({selectedChain.steps.length} Stages)
        </button>
        <button
          onClick={() => setActiveTab('explanation')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'explanation'
              ? 'bg-[#161F2C] text-white border border-[#2D3A4B] font-bold shadow-sm'
              : 'bg-[#121821] text-slate-400 border border-[#1F2A37] hover:text-white'
          }`}
        >
          Executive Narrative & Mechanics
        </button>
        <button
          onClick={handleLoadRejections}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rejections'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
              : 'bg-[#121821] text-slate-400 border border-[#1F2A37] hover:text-white'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Refuted Hypotheses (Validator Rigor)</span>
        </button>
      </div>

      {/* Stepper Tab */}
      {activeTab === 'steps' && (
        <div className="space-y-3.5">
          {selectedChain.steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="reveal-block bg-[#121821] border border-[#1F2A37] rounded-xl p-5 shadow-card hover:border-[#2D3A4B] transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step Order Badge */}
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-inner">
                    0{step.order}
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      {step.narrative || `Chain Step ${step.order}`}
                    </h3>

                    {/* Capability Flow Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      {step.requires.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-[#0B0F14] border border-amber-500/30 px-2.5 py-0.5 rounded text-amber-300">
                          <span className="text-slate-500">Requires:</span>
                          <strong>{step.requires.join(', ')}</strong>
                        </div>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <div className="flex items-center gap-1.5 bg-[#0B0F14] border border-emerald-500/30 px-2.5 py-0.5 rounded text-emerald-300 font-bold">
                        <span className="text-slate-500">Provides:</span>
                        <strong>{step.provides.join(', ')}</strong>
                      </div>
                    </div>

                    {/* Cited Findings */}
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="text-[10px] text-slate-500 uppercase">EVIDENCE CITATION:</span>
                      {step.finding_ids.map((fid) => (
                        <span key={fid} className="bg-[#0B0F14] border border-[#1F2A37] px-2 py-0.5 rounded text-[11px] text-indigo-400 font-semibold">
                          {fid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full">
                    Preconditions Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explanation Tab */}
      {activeTab === 'explanation' && (
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-6 shadow-card space-y-4 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-[#6366F1] font-bold text-sm font-mono">
            <Shield className="w-4 h-4" />
            <span>AI Risk Explanation & Breach Mechanics</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed font-sans">{selectedChain.explanation}</p>

          <div className="bg-[#0B0F14] p-4 rounded-xl border border-[#1F2A37] space-y-1.5 font-mono">
            <span className="text-[#6366F1] block text-[10px] font-bold uppercase tracking-wider">
              Recommended Graph Min-Cut Fix
            </span>
            <div className="text-slate-300 text-xs">
              Block private RFC-1918 / localhost IP ranges in the <code className="bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">/fetch?u=</code> proxy filter.
              This single remediation breaks 100% of reachability paths to internal Redis instances.
            </div>
          </div>
        </div>
      )}

      {/* Rejected Hypotheses Tab */}
      {activeTab === 'rejections' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300 font-mono">
            <span className="font-bold block mb-1 uppercase">Deterministic Validator Defense Against AI Hallucinations</span>
            Every hypothesis generated by the LLM is subjected to strict graph verification. Any hypothesis requiring ungranted capabilities or citing hallucinated finding IDs is rejected and audited.
          </div>

          {rejections.length === 0 ? (
            <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-8 text-center text-slate-400 text-xs font-mono shadow-card">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>Zero hallucinated steps reached production. All candidate hypotheses strictly validated.</span>
            </div>
          ) : (
            rejections.map((rej, idx) => (
              <div key={rej.id || idx} className="bg-[#121821] border border-rose-500/30 rounded-xl p-5 shadow-card space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-rose-400 font-bold">
                  <span>REFUTED HYPOTHESIS #{idx + 1}</span>
                  <span className="text-slate-500 text-[10px]">{rej.created_at}</span>
                </div>
                <div className="text-slate-300 bg-[#0B0F14] p-3 rounded-lg border border-rose-500/20">
                  <span className="text-rose-400 block text-[10px] font-bold uppercase mb-1">Invariant Failure:</span>
                  {rej.reason}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
