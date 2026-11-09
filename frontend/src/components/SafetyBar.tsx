import React, { useState } from 'react';
import {
  Search,
  Grid,
  Bell,
  Settings,
  Mail,
  Sun,
  ShieldCheck,
  AlertOctagon,
  ChevronDown,
  Lock,
  Unlock,
  Cpu
} from 'lucide-react';
import { triggerKillSwitch, resetKillSwitch } from '../api';

interface SafetyBarProps {
  pendingCount: number;
  auditValid: boolean;
  killLocked: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onKillStateChange: () => void;
  onOpenApprovals: () => void;
}

export const SafetyBar: React.FC<SafetyBarProps> = ({
  pendingCount,
  auditValid,
  killLocked,
  searchQuery = '',
  onSearchChange,
  onKillStateChange,
  onOpenApprovals
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
      <header className="h-16 bg-white border-b border-[#eef2f6] px-8 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
        {/* Left: Apps Grid + Search bar */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          <button className="text-[#64748b] hover:text-[#0f172a] p-1.5 rounded-lg hover:bg-[#f8fafc] transition cursor-pointer">
            <Grid className="w-4 h-4" />
          </button>

          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search findings, assets, attack paths..."
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LAB SCOPE (10.77.0.0/24)
          </div>
        </div>

        {/* Right side controls matching screenshot */}
        <div className="flex items-center gap-3">
          {/* Action icon buttons */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] transition cursor-pointer">
            <Sun className="w-4 h-4" />
          </button>

          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] transition cursor-pointer">
            <Settings className="w-4 h-4" />
          </button>

          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] transition cursor-pointer">
            <Mail className="w-4 h-4" />
          </button>

          {/* Notifications / Approvals Bell */}
          <button
            onClick={onOpenApprovals}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] relative transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-white"></span>
            )}
          </button>

          {/* Language Flag Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#475569] font-medium border-l border-[#eef2f6] pl-3">
            <span>🇺🇸</span>
            <span>EN</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 border-l border-[#eef2f6] pl-4 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#a855f7] text-white font-bold flex items-center justify-center text-xs shadow-sm">
              RD
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-[#0f172a] leading-none">Robert Doe</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">Founder / Lead</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
          </div>

          {/* Emergency Kill Switch Button */}
          <div className="border-l border-[#eef2f6] pl-3">
            {killLocked ? (
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex items-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>RESET LOCK</span>
              </button>
            ) : (
              <button
                onClick={() => setShowKillModal(true)}
                className="flex items-center gap-1.5 bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm shadow-[#ef4444]/20 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>KILL</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Kill Switch Modal */}
      {showKillModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowKillModal(false);
          }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center gap-3 text-[#ef4444] mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#ef4444] flex-shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Emergency Kill Switch</h3>
                <p className="text-xs text-[#64748b]">Instantly terminates runners and locks execution engine</p>
              </div>
            </div>

            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 text-xs text-[#991b1b] mb-4 space-y-1.5">
              <p>• Terminates all active sandbox containers immediately.</p>
              <p>• Cancels all pending approval cards.</p>
              <p>• Locks all future execution requests until admin unlock.</p>
            </div>

            <label className="block text-xs font-semibold text-[#475569] mb-1">Reason for Emergency Lockdown:</label>
            <input
              type="text"
              value={killReason}
              onChange={(e) => setKillReason(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20 transition mb-5"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleKill}
                disabled={loading}
                className="px-5 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Confirm Lockdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
