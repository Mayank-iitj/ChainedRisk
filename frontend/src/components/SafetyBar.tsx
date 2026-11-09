import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  Bell,
  Lock,
  Unlock,
  AlertTriangle,
  X
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
      <header className="h-14 bg-black border-b border-[#262626] px-6 flex items-center justify-between sticky top-0 z-20 select-none text-white font-mono">
        {/* Left Side: Scope Pill + Telemetry Search */}
        <div className="flex items-center gap-3.5 flex-1 max-w-xl">
          {/* Lab Boundary Scope Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0A0A0A] border border-[#262626] text-[11px] text-white whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span className="text-neutral-500">SCOPE:</span>
            <span className="text-white font-bold">
              {currentUser?.onboarding_profile?.scope_cidrs?.[0] || '10.77.0.0/24'}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search findings, assets, paths..."
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded pl-8 pr-12 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition font-mono"
            />
            <kbd className="absolute right-2.5 top-1.5 text-[9px] font-mono text-neutral-400 bg-[#181818] px-1 rounded border border-[#333333]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Center: Cryptographic Audit Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[#0A0A0A] border border-[#262626] text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
          <span className="text-neutral-500">LEDGER:</span>
          <span className="text-white font-bold">
            {auditValid ? 'CRYPTOGRAPHICALLY VALID [SHA-256]' : 'TAMPER DETECTED [INVALID]'}
          </span>
        </div>

        {/* Right Side: Pending HITL approvals + Kill Switch */}
        <div className="flex items-center gap-3">
          {/* HITL Approvals Gate Pill */}
          <button
            onClick={onOpenApprovals}
            title={`${pendingCount} Pending HITL Approvals`}
            className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs transition cursor-pointer ${
              pendingCount > 0
                ? 'bg-white text-black font-bold border-white shadow-sm'
                : 'bg-[#0A0A0A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'text-black' : 'text-neutral-500'}`} />
            <span>{pendingCount} Gated</span>
          </button>

          {/* Emergency Kill Switch */}
          {killLocked ? (
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-3 py-1 rounded bg-white text-black font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border-2 border-white animate-pulse"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>SYSTEM FROZEN (UNLOCK)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowKillModal(true)}
              className="px-2.5 py-1 rounded bg-transparent hover:bg-white hover:text-black border border-white/40 hover:border-white text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>KILL SWITCH</span>
            </button>
          )}
        </div>
      </header>

      {/* Emergency Kill Switch Confirm Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn font-mono">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border-2 border-white rounded-xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold tracking-wider uppercase">
                  Engage Emergency Kill Switch
                </h3>
              </div>
              <button
                onClick={() => setShowKillModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Engaging the Kill Switch immediately suspends all runner containers, revokes live approval tokens, and locks the evaluation graph into read-only mode.
            </p>

            <div>
              <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                Lock Justification (Appended to Immutable Audit Ledger)
              </label>
              <input
                type="text"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="w-full bg-black border border-[#333333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 bg-[#181818] hover:bg-[#262626] text-white rounded text-xs cursor-pointer border border-[#333333]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleKill}
                className="px-5 py-2 bg-white text-black font-bold rounded text-xs hover:bg-neutral-200 transition cursor-pointer"
              >
                {loading ? 'Engaging...' : 'CONFIRM FREEZE LOCK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
