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
      <div>
        <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
          <span className="text-white font-semibold">HITL GOVERNANCE</span> // VERIFICATION GATE
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-white" />
          <span>Human-In-The-Loop Approval Queue</span>
          {approvals.length > 0 && (
            <span className="bg-white text-black text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ml-1">
              {approvals.length} Gated
            </span>
          )}
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5 font-mono">
          Deny-by-default execution policy. No active probe executes in the lab sandbox without explicit human authorization.
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-12 text-center text-neutral-400 space-y-3 font-mono">
          <div className="w-12 h-12 rounded-xl bg-black border border-white text-white flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase">All Clear — No Pending Approvals</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto font-sans">
            When you run a verification plan on an attack chain, active probes create an Approval Card and pause here for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((card) => (
            <div
              key={card.id}
              onClick={() => onOpenCard(card)}
              className="bg-[#0A0A0A] hover:bg-[#121212] border border-[#262626] hover:border-white p-5 rounded-xl transition cursor-pointer flex flex-wrap items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="bg-white text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                    [{card.risk_level}] GATED PROBE
                  </span>
                  <span className="text-white font-bold text-sm group-hover:underline transition">
                    {card.title || `Verify Step: ${card.command.slice(0, 40)}...`}
                  </span>
                </div>

                <div className="font-mono text-neutral-200 text-xs bg-black px-3 py-1.5 rounded-lg border border-[#262626] max-w-xl truncate">
                  $ {card.command}
                </div>

                <div className="flex items-center gap-4 text-neutral-400 text-[11px] font-mono">
                  <span>Target: <strong className="text-white">{card.target.container} ({card.target.ip})</strong></span>
                  <span>Blast Radius: <strong className="text-white font-bold">{card.blast_radius.score}/100</strong></span>
                  <span className="text-neutral-300 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3" /> Expires in 600s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm">
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
