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
  Sliders,
  LogIn,
  Server,
  GitBranch,
  LogOut
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
    <aside className="w-64 bg-black border-r border-[#262626] flex flex-col h-screen sticky top-0 z-30 select-none text-white">
      {/* Brand Header */}
      <div
        onClick={onGoLanding}
        className="p-5 pb-4 flex items-center justify-between border-b border-[#262626] cursor-pointer group"
        title="Return to Public Corridor"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/20 flex items-center justify-center text-white group-hover:border-white transition shadow-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-light tracking-tight text-sm text-white flex items-center gap-1 font-mono">
              <span className="font-bold">CHAINED</span>
              <span className="font-normal text-neutral-400">RISK</span>
            </div>
            <div className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">
              // ZERO-COLOR SOC
            </div>
          </div>
        </div>
        <span className="text-[9px] font-mono text-white bg-black border border-white/40 px-1.5 py-0.5 rounded">
          v2.4
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[9px] font-mono font-bold text-neutral-500 tracking-widest uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-md'
                        : 'text-neutral-400 hover:text-white hover:bg-[#141414] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && item.badge > 0 ? (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          isActive
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-white'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black"></span>}
                    </div>
                  </button>

                  {/* Sub-items for active Dashboard tab */}
                  {isActive && item.id === 'overview' && (
                    <div className="ml-6 mt-1 space-y-1 text-[10px] font-mono text-neutral-400 pl-3 border-l border-white/30">
                      <div className="py-0.5 text-white font-bold flex items-center gap-1.5 cursor-pointer">
                        <span className="w-1 h-1 bg-white"></span>
                        Overview Metrics
                      </div>
                      <div
                        onClick={() => onSelectTab('chains')}
                        className="py-0.5 hover:text-white cursor-pointer transition"
                      >
                        Breach Paths
                      </div>
                      <div
                        onClick={() => onSelectTab('remediation')}
                        className="py-0.5 hover:text-white cursor-pointer transition"
                      >
                        Min-Cut Remediation
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
      <div className="p-3 mx-2.5 mb-3 border border-[#262626] rounded-lg bg-[#0A0A0A] text-xs space-y-2 font-mono">
        {currentUser ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="w-7 h-7 rounded border border-white/30 object-cover flex-shrink-0 grayscale contrast-125"
                  />
                ) : (
                  <div className="w-7 h-7 rounded bg-[#181818] border border-white/30 text-white font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    {currentUser.full_name
                      ? currentUser.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="truncate min-w-0">
                  <div className="font-bold text-white truncate text-xs">
                    {currentUser.full_name || currentUser.username}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {currentUser.org_name || 'Enclave Workspace'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenOnboarding && (
                  <button
                    onClick={onOpenOnboarding}
                    title="Perimeter Scope Settings"
                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[#262626] flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 truncate max-w-[130px]">
                {currentUser.title || currentUser.role.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-white font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                ACTIVE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              <div className="font-bold text-white">Guest Persona</div>
              <div className="text-[10px]">Read-only mode</div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
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
