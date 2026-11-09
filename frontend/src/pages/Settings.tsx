import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  FolderKanban,
  Cpu,
  Key,
  Globe,
  Radio,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import {
  fetchProjects,
  createNewProject,
  fetchPolicy,
  fetchPublicConfig,
  triggerKillSwitch,
  resetKillSwitch
} from '../api';
import { Project, PolicyRule, UserProfile } from '../types';

interface SettingsProps {
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  currentUser: UserProfile | null;
  onRefreshData?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  currentProjectId,
  onSelectProject,
  currentUser,
  onRefreshData
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);
  const [publicConfig, setPublicConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [killActionLoading, setKillActionLoading] = useState(false);

  // New Project Modal State
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCidr, setProjCidr] = useState('10.77.0.0/24');
  const [creatingProj, setCreatingProj] = useState(false);
  const [projError, setProjError] = useState<string | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, [currentProjectId]);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [projs, pol, cfg] = await Promise.all([
        fetchProjects(),
        fetchPolicy(),
        fetchPublicConfig()
      ]);
      setProjects(projs || []);
      setPolicyRules(pol?.rules || []);
      setPublicConfig(cfg || null);
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    setKillActionLoading(true);
    try {
      if (publicConfig?.kill_locked) {
        await resetKillSwitch();
      } else {
        await triggerKillSwitch('Administrator manual lock from settings panel');
      }
      await loadSettingsData();
      onRefreshData?.();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setKillActionLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) {
      setProjError('Project name is required');
      return;
    }
    setCreatingProj(true);
    setProjError(null);
    try {
      const newP = await createNewProject({
        name: projName,
        description: projDesc,
        scope: {
          cidrs: projCidr.split(',').map((c) => c.trim()).filter(Boolean),
          lab_only: true
        }
      });
      setShowNewProjModal(false);
      setProjName('');
      setProjDesc('');
      await loadSettingsData();
      onSelectProject(newP.id);
    } catch (err: any) {
      setProjError(err.message || 'Failed to create project');
    } finally {
      setCreatingProj(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#64748b]">
            <span className="text-[#6366f1] font-bold">Administration</span> / Governance & Settings
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#6366f1]" />
            <span>Workspace & Security Governance Settings</span>
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Configure safety boundaries, active assessment scopes, HITL dual-authorization, and cloud integrations.
          </p>
        </div>

        <button
          onClick={loadSettingsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Policy</span>
        </button>
      </div>

      {/* Grid: Project Selection & Kill Switch Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Project Management */}
        <div className="lg:col-span-2 bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Assessment Projects & Perimeters
              </h3>
            </div>
            <button
              onClick={() => setShowNewProjModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {projects.map((proj) => {
              const isActive = proj.id === currentProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{proj.name}</span>
                      {isActive && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ACTIVE ENCLAVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Scope: {proj.scope?.cidrs?.join(', ') || '10.77.0.0/24'} • ID: {proj.id}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    {isActive ? 'Current' : 'Switch →'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Emergency Kill Switch Status */}
        <div className="bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${publicConfig?.kill_locked ? 'text-red-600' : 'text-amber-500'}`} />
            <h3 className="text-sm font-extrabold text-slate-800">
              Emergency Kill Switch
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Immediately freezes all live runner containers, revokes pending approval cards, and enters read-only lockdown.
          </p>

          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            publicConfig?.kill_locked
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span>SYSTEM STATUS:</span>
              <span className="uppercase font-mono">
                {publicConfig?.kill_locked ? 'LOCKED / FREEZE' : 'ACTIVE / OPERATIONAL'}
              </span>
            </div>
            {publicConfig?.kill_locked && publicConfig.kill_reason && (
              <p className="text-[11px] font-mono opacity-90">Reason: {publicConfig.kill_reason}</p>
            )}
          </div>

          <button
            onClick={handleToggleKillSwitch}
            disabled={killActionLoading}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 ${
              publicConfig?.kill_locked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {publicConfig?.kill_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>
              {killActionLoading ? 'Processing...' : publicConfig?.kill_locked ? 'Deactivate Kill Switch (Resume)' : 'Activate Emergency Kill Switch'}
            </span>
          </button>
        </div>
      </div>

      {/* Security Invariants & Policy Rules */}
      <div className="bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              Active Safety Invariants & Execution Policies
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Enforced by Policy Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {policyRules.map((r) => (
            <div key={r.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  r.decision.includes('allow')
                    ? 'bg-emerald-100 text-emerald-800'
                    : r.decision.includes('deny')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {r.decision.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {r.target_zone ? `Zone: ${r.target_zone}` : r.risk ? `Risk Level: ${r.risk}` : 'Scope Policy'}
                {r.ttl_s ? ` • TTL: ${r.ttl_s}s` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Integrations Status */}
      <div className="bg-white border border-[#eef2f6] rounded-2xl p-6 shadow-card space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800">
          Connected Identity & Pipeline Integrations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-500" />
                Google OAuth 2.0
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                CONNECTED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono break-all">
              Client ID: 506395453665-...apps.googleusercontent.com
            </p>
            <div className="text-[10px] text-slate-400 font-mono">
              Scopes: openid, email, profile
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-indigo-500" />
                Discord HITL Channel
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                OPTIONAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Interactive Discord buttons trigger dual-authorization callbacks for gated L1/L2 actions.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-500" />
                Isolated Runner Sandbox
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                ENFORCED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Network: chained_lab (10.77.0.0/24) • UID: 10001 • Drop: ALL
            </p>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <span>Create Assessment Project</span>
              </h3>
              <button
                onClick={() => setShowNewProjModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {projError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {projError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Staging VPC Assessment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Target scope and environment notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lab CIDR Scope</label>
                <input
                  type="text"
                  value={projCidr}
                  onChange={(e) => setProjCidr(e.target.value)}
                  placeholder="10.77.0.0/24"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProj}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {creatingProj ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
