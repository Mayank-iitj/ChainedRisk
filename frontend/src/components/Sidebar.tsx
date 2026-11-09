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
  Settings as SettingsIcon
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
      title: 'MENU',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'chains', label: 'Attack Chains', icon: GitMerge },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
        { id: 'assets', label: 'Asset Inventory', icon: Server },
        { id: 'findings', label: 'Findings Pool', icon: AlertTriangle },
      ]
    },
    {
      title: 'DEFENSE & HITL',
      items: [
        { id: 'approvals', label: 'Approval Queue', icon: CheckSquare, badge: pendingApprovalsCount },
        { id: 'hypotheses', label: 'Hypotheses & Math', icon: GitBranch },
        { id: 'console', label: 'Live Console', icon: Terminal },
        { id: 'remediation', label: 'Min-Cut Fix', icon: Wrench },
      ]
    },
    {
      title: 'GOVERNANCE & ADMIN',
      items: [
        { id: 'ingest', label: 'Ingest Studio', icon: UploadCloud },
        { id: 'audit', label: 'Audit Ledger', icon: Shield },
        { id: 'reports', label: 'Reports & SARIF', icon: FileText },
        { id: 'settings', label: 'Enclave Settings', icon: Sliders },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#eef2f6] flex flex-col h-screen sticky top-0 shadow-[2px_0_12px_rgba(0,0,0,0.02)] z-30">
      {/* Brand Header */}
      <div
        onClick={onGoLanding}
        className="p-6 pb-4 flex items-center gap-3 cursor-pointer group"
        title="Return to Landing Page"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-md shadow-[#6366f1]/25 flex-shrink-0 group-hover:scale-105 transition">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-[#0f172a] flex items-center gap-1.5 group-hover:text-[#6366f1] transition">
            ChainedRisk
          </h1>
          <p className="text-[11px] text-[#94a3b8] font-medium tracking-tight">Attack Path Correlator</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-[#94a3b8] tracking-wider uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/30'
                        : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748b]'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && item.badge > 0 ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white text-[#6366f1]' : 'bg-[#ef4444] text-white'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                      {isActive && <ChevronDown className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </button>

                  {/* Sub-items for active Dashboard tab (matching the screenshot sub-items) */}
                  {isActive && item.id === 'overview' && (
                    <div className="ml-9 mt-1.5 space-y-1 text-[11px] text-[#64748b]">
                      <div className="py-1 text-[#6366f1] font-semibold flex items-center gap-1.5 cursor-pointer">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>
                        Risk Overview
                      </div>
                      <div
                        onClick={() => onSelectTab('chains')}
                        className="py-1 hover:text-[#0f172a] cursor-pointer transition"
                      >
                        Attack Paths
                      </div>
                      <div
                        onClick={() => onSelectTab('remediation')}
                        className="py-1 hover:text-[#0f172a] cursor-pointer transition"
                      >
                        Min-Cut Fix
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
      <div className="p-3.5 mx-3 mb-3 border border-[#eef2f6] rounded-2xl bg-[#f8fafc] text-xs space-y-2">
        {currentUser ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#e0e7ff] text-[#4f46e5] font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                  {currentUser.full_name
                    ? currentUser.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-bold text-[#0f172a] truncate">
                    {currentUser.full_name || currentUser.username}
                  </div>
                  <div className="text-[10px] text-[#64748b] truncate font-medium">
                    {currentUser.org_name || 'Enclave Workspace'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenOnboarding && (
                  <button
                    onClick={onOpenOnboarding}
                    title="Perimeter & Onboarding Settings"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
              <span className="text-[#94a3b8] font-mono truncate max-w-[140px]">
                {currentUser.title || currentUser.role.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <div className="font-bold text-slate-700">Guest Session</div>
              <div className="text-[10px]">Read-only preview</div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
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
