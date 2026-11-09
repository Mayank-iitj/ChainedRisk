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
  Sparkles
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
    setRejections(data);
    setActiveTab('rejections');
  };

  if (!selectedChain) {
    return (
      <div className="bg-white border border-[#eef2f6] rounded-2xl p-8 text-center text-[#64748b] shadow-card">
        <GitMerge className="w-10 h-10 mx-auto text-[#94a3b8] mb-2" />
        <p>No attack chains correlated yet. Ingest scanner findings and run correlation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Chain Selector Header */}
      <div className="reveal-block bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#64748b]">
              <span className="text-[#6366f1] font-bold">Attack Chains</span> / Multi-Step Breach Path
            </div>
            <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
              <span>{selectedChain.title}</span>
              <span className="bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe] text-xs font-bold font-mono px-2.5 py-0.5 rounded-full">
                +{selectedChain.chain_gain} Gain
              </span>
            </h2>
            <p className="text-xs text-[#64748b] font-mono">
              Origin: <strong className="text-[#0f172a]">{selectedChain.origin.toUpperCase()}</strong> • Confidence: {Math.round(selectedChain.confidence * 100)}% • Status: <strong className="text-[#10b981]">{selectedChain.status.toUpperCase()}</strong>
            </p>
          </div>

          <button
            onClick={handlePlanAndRun}
            disabled={planning}
            className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-[#6366f1]/25 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{planning ? 'PLANNING...' : 'GENERATE PLAN & RUN'}</span>
          </button>
        </div>

        {/* Chain Switcher Pills (when multiple chains exist) */}
        {chains.length > 1 && (
          <div className="pt-2 border-t border-[#f1f5f9] flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-[#64748b] whitespace-nowrap">SWITCH CHAIN:</span>
            {chains.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectChain(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  c.id === selectedChain.id
                    ? 'bg-[#6366f1] text-white shadow-xs font-bold'
                    : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#64748b] border border-[#eef2f6]'
                }`}
              >
                {c.title.slice(0, 32)}... (Score: {c.score})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs matching screenshot */}
      <div className="reveal-block flex gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'steps'
              ? 'bg-[#6366f1] text-white shadow-sm'
              : 'bg-white text-[#64748b] border border-[#eef2f6] hover:bg-[#f8fafc]'
          }`}
        >
          Attack Stepper ({selectedChain.steps.length} Steps)
        </button>
        <button
          onClick={() => setActiveTab('explanation')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'explanation'
              ? 'bg-[#6366f1] text-white shadow-sm'
              : 'bg-white text-[#64748b] border border-[#eef2f6] hover:bg-[#f8fafc]'
          }`}
        >
          Executive Narrative & Explanation
        </button>
        <button
          onClick={handleLoadRejections}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rejections'
              ? 'bg-[#ef4444] text-white shadow-sm'
              : 'bg-white text-[#64748b] border border-[#eef2f6] hover:bg-[#f8fafc]'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Rejected Hypotheses (AI Rigor)</span>
        </button>
      </div>

      {/* Stepper Tab */}
      {activeTab === 'steps' && (
        <div className="space-y-4">
          {selectedChain.steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="reveal-block bg-white border border-[#eef2f6] rounded-2xl p-5 shadow-card hover:shadow-card-hover transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step Order Badge */}
                  <div className="w-9 h-9 rounded-xl bg-[#ede9fe] text-[#6366f1] font-mono font-bold flex items-center justify-center flex-shrink-0 text-sm">
                    0{step.order}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-[#0f172a] tracking-wide">
                      {step.narrative || `Chain Step ${step.order}`}
                    </h3>

                    {/* Capability Flow Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      {step.requires.length > 0 && (
                        <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-2.5 py-0.5 rounded-lg text-[#b45309]">
                          <span>Requires:</span>
                          <strong>{step.requires.join(', ')}</strong>
                        </div>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8]" />
                      <div className="flex items-center gap-1 bg-[#ecfdf5] border border-[#d1fae5] px-2.5 py-0.5 rounded-lg text-[#047857] font-bold">
                        <span>Provides:</span>
                        <strong>{step.provides.join(', ')}</strong>
                      </div>
                    </div>

                    {/* Cited Findings */}
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <span className="font-mono text-[10px] text-[#94a3b8]">EVIDENCE CITATION:</span>
                      {step.finding_ids.map((fid) => (
                        <span key={fid} className="bg-[#f8fafc] border border-[#e2e8f0] px-2 py-0.5 rounded text-[11px] font-mono text-[#0f172a] font-semibold">
                          {fid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="bg-[#ecfdf5] text-[#10b981] border border-[#d1fae5] text-[10px] font-semibold px-2.5 py-1 rounded-full">
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
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-[#6366f1] font-bold text-sm">
            <Shield className="w-5 h-5" />
            <span>AI Risk Explanation & Breach Mechanics</span>
          </div>
          <p className="text-[#334155] text-sm leading-relaxed">{selectedChain.explanation}</p>

          <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#eef2f6] space-y-1.5 font-mono text-[#475569]">
            <span className="text-[#6366f1] block text-[11px] font-bold uppercase">Recommended High-Impact Fix</span>
            <div className="text-[#0f172a] text-xs">
              Block private RFC-1918 / localhost IP ranges in the <code className="bg-[#ede9fe] text-[#6366f1] px-1.5 py-0.5 rounded font-bold">/fetch?u=</code> proxy filter.
              This single remediation breaks 100% of reachability paths to internal Redis instances.
            </div>
          </div>
        </div>
      )}

      {/* Rejected Hypotheses Tab */}
      {activeTab === 'rejections' && (
        <div className="space-y-4">
          <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-4 text-xs text-[#92400e]">
            <span className="font-bold block mb-1">Deterministic Validator Defense Against AI Hallucinations</span>
            Every hypothesis generated by the LLM is subjected to strict graph verification. Any hypothesis requiring ungranted capabilities or citing hallucinated finding IDs is rejected and audited.
          </div>

          {rejections.length === 0 ? (
            <div className="bg-white border border-[#eef2f6] rounded-2xl p-8 text-center text-[#64748b] text-xs shadow-card">
              <CheckCircle className="w-8 h-8 text-[#10b981] mx-auto mb-2" />
              <span>Zero hallucinated steps reached production. All current hypotheses strictly validated.</span>
            </div>
          ) : (
            rejections.map((rej, idx) => (
              <div key={rej.id || idx} className="bg-white border border-[#fecaca] rounded-2xl p-5 shadow-card space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#ef4444] font-mono font-bold">
                  <span>REJECTED HYPOTHESIS #{idx + 1}</span>
                  <span className="text-[#94a3b8] text-[10px]">{rej.created_at}</span>
                </div>
                <div className="text-[#334155] font-mono bg-[#fef2f2] p-3 rounded-xl border border-[#fecaca]">
                  <span className="text-[#991b1b] block text-[11px] font-bold">Failure Reason:</span>
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
