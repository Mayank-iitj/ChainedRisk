import React from 'react';
import { CheckSquare, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ApprovalCard } from '../types';

interface ApprovalsQueueProps {
  approvals: ApprovalCard[];
  onOpenCard: (card: ApprovalCard) => void;
}

export const ApprovalsQueue: React.FC<ApprovalsQueueProps> = ({ approvals, onOpenCard }) => {
  return (
    <div className="space-y-6 pb-8">
      <div className="reveal-block">
        <div className="text-xs font-semibold text-[#64748b]">
          <span className="text-[#6366f1] font-bold">HITL Governance</span> / Verification Gate
        </div>
        <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5 flex items-center gap-2">
          <span>Human-In-The-Loop Approval Queue</span>
          {approvals.length > 0 && (
            <span className="bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe] text-xs font-bold font-mono px-2.5 py-0.5 rounded-full">
              {approvals.length} Pending
            </span>
          )}
        </h2>
        <p className="text-xs text-[#64748b] mt-0.5">
          Deny-by-default execution policy. No active probe executes in the lab sandbox without explicit human authorization.
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="reveal-block bg-white border border-[#eef2f6] rounded-2xl p-12 text-center text-[#64748b] shadow-card space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#0f172a]">All Clear — No Pending Approvals</h3>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto">
            When you run a verification plan on an attack chain, active probes create an Approval Card and pause here for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((card) => (
            <div
              key={card.id}
              onClick={() => onOpenCard(card)}
              className="reveal-block bg-white hover:bg-[#f8fafc] border border-[#eef2f6] hover:border-[#cbd5e1] p-5 rounded-2xl transition cursor-pointer flex items-center justify-between group shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                    [{card.risk_level}] GATED PROBE
                  </span>
                  <span className="text-[#0f172a] font-bold text-sm group-hover:text-[#6366f1] transition">
                    {card.title || `Verify Step: ${card.command.slice(0, 40)}...`}
                  </span>
                </div>

                <div className="font-mono text-[#0f172a] text-xs bg-[#f8fafc] px-3 py-1.5 rounded-xl border border-[#e2e8f0] max-w-xl truncate">
                  $ {card.command}
                </div>

                <div className="flex items-center gap-4 text-[#64748b] text-[11px] font-mono">
                  <span>Target: <strong className="text-[#0f172a]">{card.target.container} ({card.target.ip})</strong></span>
                  <span>Blast Radius: <strong className="text-[#6366f1]">{card.blast_radius.score}/100</strong></span>
                  <span className="text-[#d97706] flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" /> Expires soon
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-[#6366f1] group-hover:bg-[#4f46e5] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm">
                  Review & Decide
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
