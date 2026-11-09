import React, { useState } from 'react';
import {
  Search,
  Grid,
  Bell,
  Settings,
  ShieldCheck,
  AlertOctagon,
  Lock,
  Unlock,
  Cpu,
  AlertTriangle,
  X,
  Radio,
  Sparkles
} from 'lucide-react';
import { triggerKillSwitch, resetKillSwitch } from '../api';
import { UserProfile } from '../types';

interface SafetyBarProps {
  pendingCount: number;
  auditValid: boolean;
  killLocked: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onKillStateChange: () => void;
  onOpenApprovals: () => void;
  currentUser?: UserProfile | null;
  activeProjectName?: string;
  onOpenAuth?: () => void;
  onOpenOnboarding?: () => void;
}

export const SafetyBar: React.FC<SafetyBarProps> = ({
  pendingCount,
  auditValid,
  killLocked,
  searchQuery = '',
  onSearchChange,
  onKillStateChange,
  onOpenApprovals,
  currentUser,
  activeProjectName,
  onOpenAuth,
  onOpenOnboarding
}) => {
  const [showKillModal, setShowKillModal] = useState(false);
  const [killReason, setKillReason] = useState('Emergency operator override');
  const [loading, setLoading] = useState(false);

  const handleKill = async () => {
    setLoading(true);
    await triggerKillSwitch(killReason);
    setLoading(false);
    setShowKillModal(false);
    onKillStateChange();
  };

  const handleReset = async () => {
    setLoading(true);
    await resetKillSwitch();
    setLoading(false);
    onKillStateChange();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showKillModal) {
        setShowKillModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showKillModal]);

  return (
    <>
      <header className="h-14 bg-[#121821] border-b border-[#1F2A37] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left Side: Scope Pill + Telemetry Search */}
        <div className="flex items-center gap-3.5 flex-1 max-w-xl">
          {/* Lab Boundary Scope Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0B0F14] border border-[#1F2A37] font-mono text-[11px] text-slate-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[#64748B]">SCOPE:</span>
            <span className="text-emerald-400 font-semibold">
              {currentUser?.onboarding_profile?.scope_cidrs?.[0] || '10.77.0.0/24'}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search findings, assets, attack paths..."
              className="w-full bg-[#0B0F14] border border-[#1F2A37] rounded-lg pl-8 pr-12 py-1.5 text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition font-mono"
            />
            <kbd className="absolute right-2.5 top-2 text-[10px] font-mono text-[#64748B] bg-[#161F2C] px-1.5 py-0.2 rounded border border-[#1F2A37]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Center: Cryptographic Audit Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0B0F14] border border-[#1F2A37] font-mono text-[11px]">
          <ShieldCheck className={`w-3.5 h-3.5 ${auditValid ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="text-[#64748B]">LEDGER:</span>
          <span className={auditValid ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
            {auditValid ? 'CRYPTOGRAPHICALLY VALID' : 'TAMPER DETECTED'}
          </span>
        </div>

        {/* Right Side: Pending HITL approvals + Kill Switch */}
        <div className="flex items-center gap-3">
          {/* HITL Approvals Gate Pill */}
          <button
            onClick={onOpenApprovals}
            title={`${pendingCount} Pending HITL Approvals`}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border font-mono text-xs transition cursor-pointer ${
              pendingCount > 0
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-[#0B0F14] border-[#1F2A37] text-slate-400 hover:text-white'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
            <span>{pendingCount} Gated</span>
          </button>

          {/* Emergency Kill Switch */}
          {killLocked ? (
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer animate-pulse shadow-glow-crimson"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>SYSTEM FROZEN (UNLOCK)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowKillModal(true)}
              className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>KILL SWITCH</span>
            </button>
          )}

          {/* Settings Shortcut */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              title="Perimeter Scope Settings"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121821] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2A37]">
              <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>CONFIRM EMERGENCY KILL SWITCH</span>
              </div>
              <button
                onClick={() => setShowKillModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Activating the Emergency Kill Switch will immediately stop all active runner containers, revoke pending approval cards, freeze dispatch queues, and lock the platform into read-only mode.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Operator Reason for Audit Log:
              </label>
              <input
                type="text"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#1F2A37] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2A37]">
              <button
                type="button"
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleKill}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow-glow-crimson disabled:opacity-50"
              >
                {loading ? 'Locking...' : 'ACTIVATE FREEZE NOW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
