import React from 'react';
import { CheckSquare, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ApprovalCard } from '../types';

interface ApprovalsQueueProps {
  approvals: ApprovalCard[];
  onOpenCard: (card: ApprovalCard) => void;
}

export const ApprovalsQueue: React.FC<ApprovalsQueueProps> = ({ approvals, onOpenCard }) => {
  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="reveal-block">
        <div className="text-[11px] font-mono tracking-wider text-[#64748B] uppercase">
          <span className="text-[#6366F1] font-semibold">HITL GOVERNANCE</span> // VERIFICATION GATE
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#6366F1]" />
          <span>Human-In-The-Loop Approval Queue</span>
          {approvals.length > 0 && (
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ml-1">
              {approvals.length} Gated
            </span>
          )}
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5 font-mono">
          Deny-by-default execution policy. No active probe executes in the lab sandbox without explicit human authorization.
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="reveal-block bg-[#121821] border border-[#1F2A37] rounded-xl p-12 text-center text-slate-400 shadow-card space-y-3 font-mono">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase">All Clear — No Pending Approvals</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
            When you run a verification plan on an attack chain, active probes create an Approval Card and pause here for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((card) => (
            <div
              key={card.id}
              onClick={() => onOpenCard(card)}
              className="reveal-block bg-[#121821] hover:bg-[#161F2C] border border-[#1F2A37] hover:border-[#2D3A4B] p-5 rounded-xl transition cursor-pointer flex flex-wrap items-center justify-between gap-4 group shadow-card"
            >
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                    [{card.risk_level}] GATED PROBE
                  </span>
                  <span className="text-white font-bold text-sm group-hover:text-[#6366F1] transition">
                    {card.title || `Verify Step: ${card.command.slice(0, 40)}...`}
                  </span>
                </div>

                <div className="font-mono text-emerald-400 text-xs bg-[#0B0F14] px-3 py-1.5 rounded-lg border border-[#1F2A37] max-w-xl truncate">
                  $ {card.command}
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
                  <span>Target: <strong className="text-white">{card.target.container} ({card.target.ip})</strong></span>
                  <span>Blast Radius: <strong className="text-rose-400">{card.blast_radius.score}/100</strong></span>
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3" /> Expires in 600s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-[#6366F1] group-hover:bg-[#4F46E5] text-white text-xs font-mono font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm">
                  Review & Decide
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
