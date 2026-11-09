import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Share2,
  AlertTriangle,
  GitMerge,
  CheckSquare,
  Terminal,
  Wrench,
  FileText,
  Shield,
  ChevronDown,
  Layers,
  Sparkles,
  LogOut,
  Sliders,
  LogIn,
  Server,
  GitBranch,
  Settings as SettingsIcon,
  Circle
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingApprovalsCount: number;
  onGoLanding?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenOnboarding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
  onGoLanding,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenOnboarding
}) => {
  const menuSections = [
    {
      title: 'OPERATIONAL COMMAND',
      items: [
        { id: 'overview', label: 'SOC Overview', icon: LayoutDashboard },
        { id: 'chains', label: 'Attack Paths', icon: GitMerge },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
        { id: 'assets', label: 'Perimeter Assets', icon: Server },
        { id: 'findings', label: 'Findings Pool', icon: AlertTriangle },
      ]
    },
    {
      title: 'DEFENSE & HITL GATES',
      items: [
        { id: 'approvals', label: 'Approval Queue', icon: CheckSquare, badge: pendingApprovalsCount },
        { id: 'hypotheses', label: 'Hypotheses & Math', icon: GitBranch },
        { id: 'console', label: 'Runner Console', icon: Terminal },
        { id: 'remediation', label: 'Min-Cut Fix', icon: Wrench },
      ]
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'ingest', label: 'Ingest Studio', icon: UploadCloud },
        { id: 'audit', label: 'Audit Ledger', icon: Shield },
        { id: 'reports', label: 'Reports & SARIF', icon: FileText },
        { id: 'settings', label: 'Enclave Settings', icon: Sliders },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0B0F14] border-r border-[#1F2A37] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div
        onClick={onGoLanding}
        className="p-5 pb-4 flex items-center justify-between border-b border-[#1F2A37]/80 cursor-pointer group"
        title="Return to Public Corridor"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/60 transition shadow-inner">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="font-light tracking-tight text-sm text-white flex items-center gap-1">
              <span>chained</span>
              <span className="text-[#6366F1] font-semibold">risk</span>
            </div>
            <div className="text-[9px] font-mono tracking-widest text-[#64748B] uppercase">
              // CORRELATION PROTOCOL
            </div>
          </div>
        </div>
        <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
          v2.4
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[9px] font-mono font-bold text-[#475569] tracking-widest uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#161F2C] text-white border border-[#2D3A4B] shadow-sm font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121821] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#6366F1]' : 'text-[#64748B]'}`} />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && item.badge > 0 ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                          {item.badge}
                        </span>
                      ) : null}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] shadow-glow-indigo"></span>}
                    </div>
                  </button>

                  {/* Sub-items for active Dashboard tab */}
                  {isActive && item.id === 'overview' && (
                    <div className="ml-8 mt-1 space-y-1 text-[11px] font-mono text-[#64748B] pl-2 border-l border-[#1F2A37]">
                      <div className="py-0.5 text-[#6366F1] font-semibold flex items-center gap-1.5 cursor-pointer">
                        <span className="w-1 h-1 rounded-full bg-[#6366F1]"></span>
                        Telemetry Overview
                      </div>
                      <div
                        onClick={() => onSelectTab('chains')}
                        className="py-0.5 hover:text-white cursor-pointer transition"
                      >
                        Breach Trajectories
                      </div>
                      <div
                        onClick={() => onSelectTab('remediation')}
                        className="py-0.5 hover:text-white cursor-pointer transition"
                      >
                        Min-Cut Collapse
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile strip at bottom */}
      <div className="p-3 mx-2.5 mb-3 border border-[#1F2A37] rounded-xl bg-[#121821] text-xs space-y-2">
        {currentUser ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="w-7 h-7 rounded-lg border border-[#1F2A37] object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-mono font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                    {currentUser.full_name
                      ? currentUser.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="truncate min-w-0">
                  <div className="font-semibold text-white truncate text-xs">
                    {currentUser.full_name || currentUser.username}
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate font-mono">
                    {currentUser.org_name || 'Enclave Workspace'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenOnboarding && (
                  <button
                    onClick={onOpenOnboarding}
                    title="Perimeter Scope Settings"
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[#1F2A37] flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#64748B] truncate max-w-[130px]">
                {currentUser.title || currentUser.role.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <div className="font-semibold text-white">Guest Persona</div>
              <div className="text-[10px] font-mono text-[#64748B]">Read-only mode</div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
