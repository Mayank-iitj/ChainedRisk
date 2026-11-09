import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Server,
  Key,
  X,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { ApprovalCard } from '../types';
import { approveCard, denyCard, executeStep } from '../api';

interface ApprovalModalProps {
  card: ApprovalCard;
  onClose: () => void;
  onDecided: () => void;
  onRunStarted?: (stepId: string, executionId?: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ card, onClose, onDecided, onRunStarted }) => {
  const [copied, setCopied] = useState(false);
  const [justification, setJustification] = useState('');
  const [showNarrow, setShowNarrow] = useState(false);
  const [timeoutOverride, setTimeoutOverride] = useState(card.timeout_s || 20);
  const [reviewedCheckbox, setReviewedCheckbox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const expTime = new Date(card.expires_at).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [card.expires_at]);

  const copyCommand = () => {
    navigator.clipboard.writeText(card.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const narrow = showNarrow ? { timeout_s: timeoutOverride } : undefined;
      const res = await approveCard(card.id, justification || 'Approved by security reviewer in lab sandbox', narrow);
      setReceipt(res);

      if (res.token && card.step_id) {
        const execRes = await executeStep(card.step_id, res.token);
        if (onRunStarted) {
          onRunStarted(card.step_id, execRes.execution_id);
        }
      }
      onDecided();
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    setLoading(true);
    try {
      await denyCard(card.id, justification || 'Denied by reviewer');
      onDecided();
      onClose();
    } catch (e: any) {
      alert(`Deny error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn select-none"
    >
      <div className="bg-[#121821] border border-[#1F2A37] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-white">
        {/* Header Strip */}
        <div className="bg-[#0B0F14] border-b border-[#1F2A37] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
              [{card.risk_level}] APPROVAL REQUIRED
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">{card.title || 'Security Verification Action Gate'}</h2>
              <p className="text-[10px] text-[#64748B] font-mono">Chain ID: {card.chain_id || 'Active Attack Path'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#161F2C] border border-[#1F2A37] px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>expires in {formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-sans">
          {receipt ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3 font-mono">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">Action Approved & Token Dispatched</h3>
              <p className="text-xs text-slate-300 font-sans">
                Cryptographic HMAC-SHA256 authorization token has been delivered to the isolated runner sandbox.
              </p>
              <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-xl p-4 text-left font-mono text-[11px] text-slate-300 break-all space-y-1.5 shadow-inner">
                <div><span className="text-[#6366F1] font-bold">Nonce:</span> {receipt.nonce}</div>
                <div><span className="text-[#6366F1] font-bold">Token:</span> {receipt.token}</div>
              </div>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer font-sans"
              >
                Go to Execution Console
              </button>
            </div>
          ) : (
            <>
              {/* Exact Command Block */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-slate-400 font-mono text-[10px] uppercase font-bold">
                  <span>EXACT COMMAND (Immutable Preview)</span>
                  <button
                    onClick={copyCommand}
                    className="flex items-center gap-1 text-[#6366F1] hover:text-white transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-[#0B0F14] rounded-xl p-4 font-mono text-cyan-300 text-xs break-all border border-[#1F2A37] shadow-inner">
                  <span className="text-slate-600 select-none">$ </span>
                  {card.command}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-1">
                  <span>Hash: <span className="text-slate-300">{card.command_hash}</span></span>
                  <span className="text-emerald-400 font-semibold">✓ Cryptographically Sealed</span>
                </div>
              </div>

              {/* Grid: Target & Risk */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                {/* Target */}
                <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold">
                    <span className="flex items-center gap-1.5 uppercase">
                      <Server className="w-3 h-3 text-[#6366F1]" />
                      TARGET ASSET
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[9px] font-bold">
                      lab-only
                    </span>
                  </div>
                  <div className="text-white font-bold text-sm">{card.target.container || card.target.asset_id}</div>
                  <div className="text-slate-400 text-[11px]">IP: {card.target.ip} (via app-lab)</div>
                </div>

                {/* Risk Level */}
                <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px] font-semibold flex items-center gap-1.5 uppercase">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    RISK LEVEL
                  </div>
                  <div className="text-white font-bold text-sm">Level {card.risk_level}: Read-Only Probe</div>
                  <div className="text-slate-400 text-[11px]">Reversible • No persistent write</div>
                </div>
              </div>

              {/* Blast Radius Box */}
              <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-xl p-4 space-y-2.5 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">BLAST RADIUS METRICS</span>
                  <span className="text-rose-400 font-bold">{card.blast_radius.score}/100</span>
                </div>
                {/* Progress Meter */}
                <div className="w-full bg-[#161F2C] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, card.blast_radius.score)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
                  <div className="bg-[#121821] p-2 rounded-lg border border-[#1F2A37]">
                    <span className="text-slate-500 block text-[9px] uppercase">Reachable</span>
                    <span className="text-white font-bold">{card.blast_radius.reachable_assets.length} Hosts</span>
                  </div>
                  <div className="bg-[#121821] p-2 rounded-lg border border-[#1F2A37]">
                    <span className="text-slate-500 block text-[9px] uppercase">Datastores</span>
                    <span className="text-white font-bold">{card.blast_radius.datastores?.length || 0} Synthetic</span>
                  </div>
                  <div className="bg-[#121821] p-2 rounded-lg border border-[#1F2A37]">
                    <span className="text-slate-500 block text-[9px] uppercase">Boundary</span>
                    <span className="text-emerald-400 font-bold">{card.blast_radius.network_scope}</span>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-xl p-4 space-y-1.5 text-slate-300">
                <div className="text-[10px] font-mono font-bold text-[#6366F1] uppercase tracking-wider">
                  Precondition Rationale & Verification Objective
                </div>
                <p className="leading-relaxed text-xs">{card.reason}</p>
                <div className="flex justify-between items-center pt-2 border-t border-[#1F2A37] text-[10px] font-mono text-slate-500">
                  <span>Rollback: <strong className="text-white">{card.rollback}</strong></span>
                  <span>Execution Timeout: <strong className="text-white">{timeoutOverride}s</strong></span>
                </div>
              </div>

              {/* Scope Narrowing Accordion */}
              <div className="border border-[#1F2A37] rounded-xl overflow-hidden bg-[#0B0F14] font-mono">
                <button
                  type="button"
                  onClick={() => setShowNarrow(!showNarrow)}
                  className="w-full px-4 py-2 flex items-center justify-between text-slate-400 hover:text-white transition text-xs cursor-pointer"
                >
                  <span className="text-[11px]">Scope Narrowing Controls</span>
                  {showNarrow ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showNarrow && (
                  <div className="p-3.5 bg-[#121821] border-t border-[#1F2A37] space-y-2">
                    <label className="block text-[10px] text-slate-400 uppercase">
                      Execution Timeout Limit (Seconds):
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={timeoutOverride}
                      onChange={(e) => setTimeoutOverride(Number(e.target.value))}
                      className="w-full bg-[#0B0F14] border border-[#1F2A37] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>
                )}
              </div>

              {/* Reviewer Confirmation Checkbox */}
              <div className="flex items-center gap-2.5 pt-1 text-slate-300 font-medium text-xs">
                <input
                  type="checkbox"
                  id="reviewConfirm"
                  checked={reviewedCheckbox}
                  onChange={(e) => setReviewedCheckbox(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6366F1] border-slate-700 bg-slate-900 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="reviewConfirm" className="cursor-pointer select-none text-[11px] font-mono">
                  I have verified target IP, command hash, and isolated lab bounds (10.77.0.0/24).
                </label>
              </div>

              {/* Justification Input */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  Reviewer Justification / Audit Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized lab reachability check for step 2 verification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-[#0B0F14] border border-[#1F2A37] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F2A37]">
                <button
                  type="button"
                  onClick={handleDeny}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-mono text-xs font-bold transition cursor-pointer"
                >
                  Deny Action
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading || !reviewedCheckbox}
                    className={`px-5 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 ${
                      reviewedCheckbox
                        ? 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-glow-indigo cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    Approve & Issue Token
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
