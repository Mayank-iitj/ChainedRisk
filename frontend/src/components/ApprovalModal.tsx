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
  Key
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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white border border-[#e2e8f0] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 transform transition-all">
        {/* Header Strip */}
        <div className="bg-[#f8fafc] border-b border-[#eef2f6] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#ede9fe] text-[#6366f1] border border-[#ddd6fe]">
              [{card.risk_level}] APPROVAL REQUIRED
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-[#0f172a] tracking-tight">{card.title || 'Security Verification Action Gate'}</h2>
              <p className="text-[11px] text-[#64748b] font-mono">Chain: {card.chain_id || 'Active Attack Path'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] px-3 py-1 rounded-xl text-xs font-mono font-bold text-[#b45309] shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#d97706]" />
            <span>expires in {formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {receipt ? (
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-[#10b981] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#065f46]">Action Approved & Token Issued</h3>
              <p className="text-xs text-[#047857]">
                Cryptographic HMAC-SHA256 authorization token has been signed and delivered to the runner sandbox.
              </p>
              <div className="bg-white border border-[#d1fae5] rounded-xl p-4 text-left font-mono text-[11px] text-[#334155] break-all space-y-1.5 shadow-sm">
                <div><span className="text-[#6366f1] font-bold">Nonce:</span> {receipt.nonce}</div>
                <div><span className="text-[#6366f1] font-bold">Token:</span> {receipt.token}</div>
              </div>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Go to Execution Console
              </button>
            </div>
          ) : (
            <>
              {/* Exact Command Block */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-[#475569] font-semibold text-[11px]">
                  <span>EXACT COMMAND (Immutable Preview)</span>
                  <button
                    onClick={copyCommand}
                    className="flex items-center gap-1 text-[#6366f1] hover:text-[#4f46e5] transition font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-[#0f172a] rounded-2xl p-4 font-mono text-[#38bdf8] text-xs break-all shadow-inner">
                  <span className="text-slate-500 select-none">$ </span>
                  {card.command}
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] mt-1.5 px-1">
                  <span>Hash: <span className="text-[#0f172a] font-semibold">{card.command_hash}</span></span>
                  <span className="text-[#10b981] font-semibold">✓ Tamper-check active</span>
                </div>
              </div>

              {/* Grid: Target & Risk */}
              <div className="grid grid-cols-2 gap-3">
                {/* Target */}
                <div className="bg-[#f8fafc] border border-[#eef2f6] rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[#64748b] text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#6366f1]" />
                      TARGET ASSET
                    </span>
                    <span className="bg-[#ecfdf5] text-[#10b981] border border-[#d1fae5] px-2 py-0.5 rounded-full text-[10px] font-bold">
                      lab-only
                    </span>
                  </div>
                  <div className="text-[#0f172a] font-extrabold text-sm">{card.target.container || card.target.asset_id}</div>
                  <div className="text-[#64748b] font-mono text-[11px]">IP: {card.target.ip} (via app-lab)</div>
                </div>

                {/* Risk Level */}
                <div className="bg-[#f8fafc] border border-[#eef2f6] rounded-2xl p-3.5 space-y-1">
                  <div className="text-[#64748b] text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />
                    RISK LEVEL
                  </div>
                  <div className="text-[#0f172a] font-extrabold text-sm">Level {card.risk_level}: Read-Only Probe</div>
                  <div className="text-[#64748b] text-[11px]">Reversible • No persistent state change</div>
                </div>
              </div>

              {/* Blast Radius Box */}
              <div className="bg-[#f8fafc] border border-[#eef2f6] rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#0f172a] font-bold">BLAST RADIUS METRICS</span>
                  <span className="text-[#6366f1] font-mono font-extrabold">{card.blast_radius.score}/100</span>
                </div>
                {/* Progress Meter */}
                <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6366f1] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, card.blast_radius.score)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#475569]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#eef2f6] shadow-sm">
                    <span className="text-[#94a3b8] block text-[10px]">Reachable Assets</span>
                    <span className="text-[#0f172a] font-bold">{card.blast_radius.reachable_assets.length} Hosts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#eef2f6] shadow-sm">
                    <span className="text-[#94a3b8] block text-[10px]">Datastores</span>
                    <span className="text-[#0f172a] font-bold">{card.blast_radius.datastores?.length || 0} Synthetic</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#eef2f6] shadow-sm">
                    <span className="text-[#94a3b8] block text-[10px]">Scope Boundary</span>
                    <span className="text-[#10b981] font-bold">{card.blast_radius.network_scope}</span>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="bg-[#f8fafc] border border-[#eef2f6] rounded-2xl p-4 space-y-1.5 text-[#334155]">
                <div className="text-[11px] font-bold text-[#6366f1] uppercase tracking-wide">Precondition Rationale</div>
                <p className="leading-relaxed">{card.reason}</p>
                <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0] text-[11px] font-mono text-[#64748b]">
                  <span>Rollback: <strong className="text-[#0f172a]">{card.rollback}</strong></span>
                  <span>Execution Timeout: <strong className="text-[#0f172a]">{timeoutOverride}s</strong></span>
                </div>
              </div>

              {/* Scope Narrowing Accordion */}
              <div className="border border-[#eef2f6] rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowNarrow(!showNarrow)}
                  className="w-full bg-[#f8fafc] px-4 py-2.5 flex items-center justify-between text-[#475569] hover:text-[#0f172a] transition text-xs font-semibold"
                >
                  <span>Scope Narrowing Options</span>
                  {showNarrow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showNarrow && (
                  <div className="p-4 bg-white border-t border-[#eef2f6] space-y-2">
                    <label className="block text-[11px] font-semibold text-[#475569]">
                      Execution Timeout Limit (Seconds):
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={timeoutOverride}
                      onChange={(e) => setTimeoutOverride(Number(e.target.value))}
                      className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-[#0f172a] font-mono text-xs focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition"
                    />
                  </div>
                )}
              </div>

              {/* Reviewer Confirmation Checkbox */}
              <div className="flex items-center gap-2 pt-1 text-[#334155] font-semibold text-xs">
                <input
                  type="checkbox"
                  id="reviewConfirm"
                  checked={reviewedCheckbox}
                  onChange={(e) => setReviewedCheckbox(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6366f1] border-[#cbd5e1] focus:ring-2 focus:ring-[#6366f1]/20 cursor-pointer"
                />
                <label htmlFor="reviewConfirm" className="cursor-pointer select-none">
                  I have inspected the target IP, command hash, and blast radius boundaries.
                </label>
              </div>

              {/* Justification Input */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Reviewer Justification / Audit Note:</label>
                <input
                  type="text"
                  placeholder="e.g. Authorized lab reachability check for step 2 verification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-[#0f172a] text-xs focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#eef2f6]">
                <button
                  type="button"
                  onClick={handleDeny}
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#ef4444] border border-[#fecaca] rounded-xl font-bold transition cursor-pointer"
                >
                  Deny Action
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading || !reviewedCheckbox}
                    className={`px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                      reviewedCheckbox
                        ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-[#6366f1]/30 cursor-pointer'
                        : 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
                    }`}
                  >
                    <Key className="w-4 h-4" />
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
