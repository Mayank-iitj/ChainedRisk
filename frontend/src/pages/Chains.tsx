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
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-12 text-center text-neutral-400 font-mono">
        <GitMerge className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
        <h3 className="text-sm font-bold text-white uppercase">No Attack Chains Correlated</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          Ingest scanner findings in Ingest Studio and execute the correlation engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* Chain Selector Header */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
              <span className="text-white font-semibold">ATTACK PATH</span> // MULTI-STAGE TRAJECTORY
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>{selectedChain.title}</span>
              <span className="bg-white text-black font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                Score {selectedChain.score} (+{selectedChain.chain_gain} Gain)
              </span>
            </h2>
            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 pt-0.5">
              <span>ORIGIN: <strong className="text-white">{selectedChain.origin.toUpperCase()}</strong></span>
              <span>CONFIDENCE: <strong className="text-white">{Math.round(selectedChain.confidence * 100)}%</strong></span>
              <span>STATUS: <strong className="text-neutral-200">{selectedChain.status.toUpperCase()}</strong></span>
            </div>
          </div>

          <button
            onClick={handlePlanAndRun}
            disabled={planning}
            className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{planning ? 'COMPUTING PLAN...' : 'GENERATE PLAN & RUN'}</span>
          </button>
        </div>

        {/* Chain Switcher Pills */}
        {chains.length > 1 && (
          <div className="pt-3 border-t border-[#262626] flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-[10px] text-neutral-400 whitespace-nowrap font-bold uppercase">PATHS:</span>
            {chains.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectChain(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer ${
                  c.id === selectedChain.id
                    ? 'bg-white text-black font-bold'
                    : 'bg-black text-neutral-400 border border-[#262626] hover:text-white hover:border-neutral-500'
                }`}
              >
                {c.title.slice(0, 36)}... (Score: {c.score})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'steps'
              ? 'bg-white text-black font-bold'
              : 'bg-[#0A0A0A] text-neutral-400 border border-[#262626] hover:text-white'
          }`}
        >
          Attack Stepper ({selectedChain.steps.length} Stages)
        </button>
        <button
          onClick={() => setActiveTab('explanation')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'explanation'
              ? 'bg-white text-black font-bold'
              : 'bg-[#0A0A0A] text-neutral-400 border border-[#262626] hover:text-white'
          }`}
        >
          Executive Narrative & Mechanics
        </button>
        <button
          onClick={handleLoadRejections}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rejections'
              ? 'bg-white text-black font-bold'
              : 'bg-[#0A0A0A] text-neutral-400 border border-[#262626] hover:text-white'
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
              className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-5 hover:border-neutral-500 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step Order Badge */}
                  <div className="w-8 h-8 rounded-lg bg-black border border-white text-white font-mono font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    0{step.order}
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      {step.narrative || `Chain Step ${step.order}`}
                    </h3>

                    {/* Capability Flow Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      {step.requires.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-black border border-[#333333] px-2.5 py-0.5 rounded text-neutral-300">
                          <span className="text-neutral-500">Requires:</span>
                          <strong>{step.requires.join(', ')}</strong>
                        </div>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      <div className="flex items-center gap-1.5 bg-white text-black border border-white px-2.5 py-0.5 rounded font-bold">
                        <span className="text-neutral-700">Provides:</span>
                        <strong>{step.provides.join(', ')}</strong>
                      </div>
                    </div>

                    {/* Cited Findings */}
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                      <span className="text-[10px] text-neutral-500 uppercase">EVIDENCE CITATION:</span>
                      {step.finding_ids.map((fid) => (
                        <span key={fid} className="bg-black border border-[#262626] px-2 py-0.5 rounded text-[11px] text-neutral-200 font-semibold">
                          {fid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="bg-black text-white border border-[#404040] text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full">
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
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
            <Shield className="w-4 h-4 text-white" />
            <span>AI Risk Explanation & Breach Mechanics</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed font-sans">{selectedChain.explanation}</p>

          <div className="bg-black p-4 rounded-xl border border-[#262626] space-y-1.5 font-mono">
            <span className="text-white block text-[10px] font-bold uppercase tracking-wider">
              Recommended Graph Min-Cut Fix
            </span>
            <div className="text-neutral-300 text-xs">
              {selectedChain.remediation && selectedChain.remediation.length > 0 ? (
                <>
                  Execute <strong>{selectedChain.remediation[0].action}</strong> on finding ID <code className="bg-neutral-900 text-white px-1.5 py-0.5 rounded border border-[#333333]">{selectedChain.remediation[0].finding_id}</code>.
                  This bottleneck intervention cuts <strong>{selectedChain.remediation[0].risk_eliminated} points</strong> of cumulative risk and breaks <strong>{selectedChain.remediation[0].breaks_chains_count}</strong> active attack path(s) to crown jewels.
                </>
              ) : (
                <>
                  Implement strict ingress and egress boundary filters on intermediate pivot hops to sever the capability chain.
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejected Hypotheses Tab */}
      {activeTab === 'rejections' && (
        <div className="space-y-4">
          <div className="bg-black border border-neutral-700 rounded-xl p-4 text-xs text-neutral-300 font-mono">
            <span className="font-bold text-white block mb-1 uppercase">Deterministic Validator Defense Against AI Hallucinations</span>
            Every hypothesis generated by the LLM is subjected to strict graph verification. Any hypothesis requiring ungranted capabilities or citing hallucinated finding IDs is rejected and audited.
          </div>

          {rejections.length === 0 ? (
            <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-8 text-center text-neutral-400 text-xs font-mono">
              <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
              <span>Zero hallucinated steps reached production. All candidate hypotheses strictly validated.</span>
            </div>
          ) : (
            rejections.map((rej, idx) => (
              <div key={rej.id || idx} className="bg-[#0A0A0A] border border-[#333333] rounded-xl p-5 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-white font-bold">
                  <span>REFUTED HYPOTHESIS #{idx + 1}</span>
                  <span className="text-neutral-500 text-[10px]">{rej.created_at}</span>
                </div>
                <div className="text-neutral-300 bg-black p-3 rounded-lg border border-[#262626]">
                  <span className="text-white block text-[10px] font-bold uppercase mb-1">Invariant Failure:</span>
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
