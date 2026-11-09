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
    <div className="space-y-6 pb-8 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
            <span className="text-white font-bold">Administration</span> // Governance & Enclaves
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-white" />
            <span>Workspace & Security Governance Settings</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Configure safety boundaries, active assessment scopes, HITL dual-authorization, and cloud integrations.
          </p>
        </div>

        <button
          onClick={loadSettingsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] border border-[#262626] hover:border-white text-neutral-300 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Policy</span>
        </button>
      </div>

      {/* Grid: Project Selection & Kill Switch Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Project Management */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Assessment Projects & Perimeters
              </h3>
            </div>
            <button
              onClick={() => setShowNewProjModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
                  className={`p-4 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-black border-2 border-white'
                      : 'bg-black border border-[#262626] hover:border-neutral-500'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white font-mono">{proj.name}</span>
                      {isActive && (
                        <span className="bg-white text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          ACTIVE ENCLAVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Scope: {proj.scope?.cidrs?.join(', ') || '10.77.0.0/24'} • ID: {proj.id}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                    {isActive ? 'Current' : 'Switch →'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Emergency Kill Switch Status */}
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Emergency Kill Switch
            </h3>
          </div>

          <p className="text-xs text-neutral-400 font-mono leading-relaxed">
            Immediately freezes all live runner containers, revokes pending approval cards, and enters read-only lockdown.
          </p>

          <div className={`p-4 rounded-lg border text-xs space-y-2 font-mono ${
            publicConfig?.kill_locked
              ? 'bg-black border-2 border-white text-white'
              : 'bg-black border border-[#262626] text-neutral-200'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span>SYSTEM STATUS:</span>
              <span className="uppercase">
                {publicConfig?.kill_locked ? 'LOCKED / FREEZE' : 'ACTIVE / OPERATIONAL'}
              </span>
            </div>
            {publicConfig?.kill_locked && publicConfig.kill_reason && (
              <p className="text-[10px] text-neutral-400">Reason: {publicConfig.kill_reason}</p>
            )}
          </div>

          <button
            onClick={handleToggleKillSwitch}
            disabled={killActionLoading}
            className="w-full py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-neutral-200 text-black disabled:opacity-50"
          >
            {publicConfig?.kill_locked ? <Unlock className="w-4 h-4 stroke-[2.5]" /> : <Lock className="w-4 h-4 stroke-[2.5]" />}
            <span>
              {killActionLoading ? 'Processing...' : publicConfig?.kill_locked ? 'Deactivate Kill Switch (Resume)' : 'Activate Emergency Kill Switch'}
            </span>
          </button>
        </div>
      </div>

      {/* Security Invariants & Policy Rules */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Active Safety Invariants & Execution Policies
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">Enforced by Policy Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {policyRules.map((r) => (
            <div key={r.id} className="p-3.5 bg-black border border-[#262626] rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white">{r.id}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border border-white bg-black text-white">
                  {r.decision.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono">
                {r.target_zone ? `Zone: ${r.target_zone}` : r.risk ? `Risk Level: ${r.risk}` : 'Scope Policy'}
                {r.ttl_s ? ` • TTL: ${r.ttl_s}s` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Integrations Status */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Connected Identity & Pipeline Integrations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-black border border-[#262626] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-white" />
                Google OAuth 2.0
              </span>
              <span className="text-[10px] font-bold text-black bg-white px-2 py-0.5 rounded">
                CONNECTED
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono break-all">
              Client ID: 506395453665-...apps.googleusercontent.com
            </p>
            <div className="text-[10px] text-neutral-500 font-mono">
              Scopes: openid, email, profile
            </div>
          </div>

          <div className="p-4 bg-black border border-[#262626] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-white" />
                Discord HITL Channel
              </span>
              <span className="text-[10px] font-bold text-white border border-[#404040] px-2 py-0.5 rounded">
                OPTIONAL
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Interactive Discord buttons trigger dual-authorization callbacks for gated L1/L2 actions.
            </p>
          </div>

          <div className="p-4 bg-black border border-[#262626] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-white" />
                Isolated Runner Sandbox
              </span>
              <span className="text-[10px] font-bold text-black bg-white px-2 py-0.5 rounded">
                ENFORCED
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Network: chained_lab (10.77.0.0/24) • UID: 10001 • Drop: ALL
            </p>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0A0A0A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#262626]">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-white" />
                <span>Create Assessment Project</span>
              </h3>
              <button
                onClick={() => setShowNewProjModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {projError && (
              <div className="p-3 bg-black border border-white text-white text-xs font-mono rounded-lg">
                {projError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Staging VPC Assessment"
                  className="w-full px-3 py-2 bg-black border border-[#262626] text-white rounded-lg focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Description</label>
                <input
                  type="text"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Target scope and environment notes"
                  className="w-full px-3 py-2 bg-black border border-[#262626] text-white rounded-lg focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Lab CIDR Scope</label>
                <input
                  type="text"
                  value={projCidr}
                  onChange={(e) => setProjCidr(e.target.value)}
                  placeholder="10.77.0.0/24"
                  className="w-full px-3 py-2 bg-black border border-[#262626] text-white rounded-lg font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-[#262626] rounded-lg font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProj}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-mono uppercase tracking-wider font-bold rounded-lg cursor-pointer disabled:opacity-50"
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
