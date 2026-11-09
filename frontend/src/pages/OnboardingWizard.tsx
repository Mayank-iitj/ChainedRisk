import React, { useState } from 'react';
import {
  Shield,
  Building,
  Server,
  Layers,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Terminal,
  Cpu,
  Radio,
  FileCode,
  Activity,
  Plus,
  Trash2
} from 'lucide-react';
import { submitOnboarding } from '../api';
import { UserProfile, OnboardingProfileData, OnboardingAssetInput } from '../types';

interface OnboardingWizardProps {
  currentUser: UserProfile;
  onComplete: (projectId: string, updatedUser: UserProfile) => void;
  onSkip?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  currentUser,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [provisioningLogs, setProvisioningLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Organization & Threat Landscape
  const [orgName, setOrgName] = useState(currentUser.org_name || 'Apex Cyber Labs');
  const [industry, setIndustry] = useState('Financial Services / FinTech');
  const [environment, setEnvironment] = useState('AWS Multi-Account + Docker Lab');
  const [riskTolerance, setRiskTolerance] = useState('standard'); // zero_tolerance, standard, high_gain_only

  // Step 2: Assessment Scope & Boundaries
  const [projectName, setProjectName] = useState(`${orgName} Core Assessment`);
  const [projectDescription, setProjectDescription] = useState('Production-mirrored multi-tier assessment environment with HITL blast-radius gates.');
  const [scopeCidrs, setScopeCidrs] = useState<string[]>(['10.77.0.0/24']);
  const [newCidr, setNewCidr] = useState('');

  // Assets
  const [ingressNodes, setIngressNodes] = useState<OnboardingAssetInput[]>([
    {
      name: 'app.lab (DMZ Public Proxy)',
      ip: '10.77.0.10',
      type: 'Host',
      zone: 'dmz',
      services: ['flask', 'nginx'],
      datastores: []
    }
  ]);

  const [crownJewels, setCrownJewels] = useState<OnboardingAssetInput[]>([
    {
      name: 'redis.lab (Core In-Memory Cache)',
      ip: '10.77.0.12',
      type: 'Host',
      zone: 'internal',
      services: ['redis'],
      datastores: ['ds_cache']
    },
    {
      name: 'git.lab (Internal SCM Master)',
      ip: '10.77.0.11',
      type: 'Host',
      zone: 'internal',
      services: ['nginx', 'git'],
      datastores: ['ds_source_repo']
    }
  ]);

  // Step 3: Ingestion Pipeline & Scanners
  const [selectedScanners, setSelectedScanners] = useState<string[]>(['nmap', 'gitleaks', 'nuclei', 'httpx']);
  const [notificationChannel, setNotificationChannel] = useState('discord');
  const [notificationWebhook, setNotificationWebhook] = useState(currentUser.discord_id || '');
  const [seedBaselineScenario, setSeedBaselineScenario] = useState(true);

  const toggleScanner = (scannerId: string) => {
    setSelectedScanners((prev) =>
      prev.includes(scannerId) ? prev.filter((s) => s !== scannerId) : [...prev, scannerId]
    );
  };

  const addCidr = () => {
    if (newCidr.trim() && !scopeCidrs.includes(newCidr.trim())) {
      setScopeCidrs([...scopeCidrs, newCidr.trim()]);
      setNewCidr('');
    }
  };

  const removeCidr = (cidr: string) => {
    setScopeCidrs(scopeCidrs.filter((c) => c !== cidr));
  };

  const handleSubmitOnboarding = async () => {
    setError(null);
    setLoading(true);
    setProvisioningLogs([
      'INIT: Allocating isolated tenant workspace...',
      `TENANT: Setting boundary parameters for "${orgName}"`,
      `SCOPE: Registering authorized CIDRs: ${scopeCidrs.join(', ')}`,
      `TOPOLOGY: Provisioning DMZ ingress (${ingressNodes.length} nodes) and Crown Jewels (${crownJewels.length} targets)...`,
    ]);

    const payload: OnboardingProfileData = {
      org_name: orgName,
      industry,
      environment,
      risk_tolerance: riskTolerance,
      project_name: projectName,
      project_description: projectDescription,
      scope_cidrs: scopeCidrs,
      ingress_assets: ingressNodes,
      crown_jewels: crownJewels,
      active_scanners: selectedScanners,
      notification_channel: notificationChannel,
      notification_webhook: notificationWebhook,
      seed_baseline_scenario: seedBaselineScenario
    };

    try {
      // Simulate real step updates for awesome UX
      await new Promise((r) => setTimeout(r, 600));
      setProvisioningLogs((prev) => [...prev, 'INGEST: Normalizing security scan logs & evidence trees...']);

      await new Promise((r) => setTimeout(r, 600));
      setProvisioningLogs((prev) => [
        ...prev,
        'CORRELATION: Executing multi-stage attack path correlator (ChainedRisk Engine)...',
        'HITL: Initializing cryptographic HMAC approval token keys...'
      ]);

      const res = await submitOnboarding(payload);

      setProvisioningLogs((prev) => [
        ...prev,
        `COMPLETE: Project "${res.project_id}" ready. Launching Dashboard...`
      ]);

      await new Promise((r) => setTimeout(r, 500));
      onComplete(res.project_id, res.user);
    } catch (err: any) {
      setError(err.message || 'Onboarding initialization failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-3xl bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="border-b border-slate-800 px-8 py-6 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">ChainedRisk</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  INITIAL ONBOARDING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your organization perimeter, target scope, and safety boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* Step Progress Stepper */}
        {!loading && (
          <div className="px-8 pt-6 pb-2">
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: 1, label: '1. Threat Posture', desc: 'Org & Risk Tolerance' },
                { step: 2, label: '2. Scope & Jewels', desc: 'Perimeter & Targets' },
                { step: 3, label: '3. Ingest & Telemetry', desc: 'Scanners & Baseline' }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPast = currentStep > s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => !loading && setCurrentStep(s.step as any)}
                    className={`p-3 rounded-2xl border transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                        : isPast
                        ? 'bg-slate-900/40 border-slate-700/60'
                        : 'bg-slate-950/20 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : isPast
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPast ? '✓' : s.step}
                      </div>
                      <span className="text-xs font-bold text-white">{s.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 pl-7">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-950/50 border border-red-500/50 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body or Provisioning State */}
        <div className="p-8">
          {loading ? (
            /* Live Terminal Provisioning State */
            <div className="space-y-4 py-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto animate-pulse">
                  <Cpu className="w-6 h-6 animate-spin" />
                </div>
                <h4 className="text-base font-extrabold text-white tracking-tight">
                  Provisioning Security Enclave & Correlating Attacks...
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Applying graph invariants, generating baseline telemetry, and verifying HMAC signature gates.
                </p>
              </div>

              {/* Terminal Box */}
              <div className="bg-black/80 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-indigo-300/90 space-y-1.5 shadow-inner max-h-56 overflow-y-auto">
                {provisioningLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">$</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : currentStep === 1 ? (
            /* Step 1: Org & Threat Posture */
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Organization / Company Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value);
                        setProjectName(`${e.target.value} Core Assessment`);
                      }}
                      placeholder="e.g. Acme FinTech Labs"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Industry Vertical *
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="Financial Services / FinTech">Financial Services / FinTech</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Cloud SaaS & Core Infrastructure">Cloud SaaS & Core Infrastructure</option>
                    <option value="E-Commerce & Digital Retail">E-Commerce & Digital Retail</option>
                    <option value="Defense & Critical Infrastructure">Defense & Critical Infrastructure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Primary Cloud & Hosting Environment *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'AWS Multi-Account + Docker Lab', label: 'AWS Multi-Account', icon: Server },
                    { id: 'Google Cloud Platform (GCP)', label: 'GCP Kubernetes', icon: Layers },
                    { id: 'Hybrid Datacenter / Bare Metal', label: 'Hybrid On-Prem', icon: Database }
                  ].map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setEnvironment(env.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        environment === env.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <env.icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-xs font-bold">{env.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Risk Tolerance & Alert Fatigue Policy
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'zero_tolerance',
                      title: 'Zero Tolerance',
                      desc: 'Alert on any chain gain. Strict kill-switch locks on anomalous probes.'
                    },
                    {
                      id: 'standard',
                      title: 'Enterprise Standard',
                      desc: 'Correlate multi-stage pivots. Suppress isolated noise by ~98%.'
                    },
                    {
                      id: 'high_gain_only',
                      title: 'Critical Focus',
                      desc: 'Only report breach paths leading to confirmed crown-jewel theft.'
                    }
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setRiskTolerance(p.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer space-y-1 ${
                        riskTolerance === p.id
                          ? 'bg-indigo-950/40 border-indigo-500 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">{p.title}</span>
                        {riskTolerance === p.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                >
                  <span>Next: Define Perimeter Scope</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* Step 2: Perimeter Scope & Targets */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Primary Assessment Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Staging VPC Assessment"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              {/* In-Scope CIDRs */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Authorized In-Scope CIDR Ranges *
                  </label>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    Enforcing INV-1 Lab-Only Boundary
                  </span>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCidr}
                    onChange={(e) => setNewCidr(e.target.value)}
                    placeholder="e.g. 10.77.0.0/24 or 172.20.0.0/16"
                    className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={addCidr}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add CIDR</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {scopeCidrs.map((cidr) => (
                    <span
                      key={cidr}
                      className="bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-mono px-3 py-1 rounded-lg flex items-center gap-2"
                    >
                      <span>{cidr}</span>
                      {scopeCidrs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCidr(cidr)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ingress DMZ Node & Crown Jewels Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      DMZ Ingress Assets ({ingressNodes.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">10.77.0.10</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    {ingressNodes.map((ing, i) => (
                      <div key={i} className="flex justify-between font-mono text-[10px]">
                        <span className="text-white">{ing.name}</span>
                        <span className="text-indigo-400">{ing.services.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Crown Jewel Targets ({crownJewels.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">10.77.0.11 - 12</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    {crownJewels.map((jwl, i) => (
                      <div key={i} className="flex justify-between font-mono text-[10px]">
                        <span className="text-white">{jwl.name}</span>
                        <span className="text-emerald-400">{jwl.datastores.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety Invariant Badges */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>
                    Cryptographic Safety Invariants (INV-1 through INV-12) will be strictly enforced.
                  </span>
                </div>
                <span className="text-emerald-400 font-bold font-mono">ENFORCED</span>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                >
                  <span>Next: Integrations & Telemetry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 3: Ingestion Pipeline & Telemetry Baseline */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Active Tool Pipelines Deployed
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'nmap', name: 'Nmap / Masscan', desc: 'Port & Service Scan' },
                    { id: 'gitleaks', name: 'Gitleaks', desc: 'Secret & SCM Leaks' },
                    { id: 'nuclei', name: 'Nuclei Scanner', desc: 'Template Vulnerability' },
                    { id: 'httpx', name: 'HTTPX / Headers', desc: 'Web Fingerprint' }
                  ].map((tool) => {
                    const isSelected = selectedScanners.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleScanner(tool.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{tool.name}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-700'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{tool.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Webhook & Notification Channel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    HITL Approval Notification Channel
                  </label>
                  <select
                    value={notificationChannel}
                    onChange={(e) => setNotificationChannel(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="discord">Discord Webhook / Channel</option>
                    <option value="slack">Slack Incoming Webhook</option>
                    <option value="email">Security Operations Center Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Channel Identifier / Webhook URL
                  </label>
                  <input
                    type="text"
                    value={notificationWebhook}
                    onChange={(e) => setNotificationWebhook(e.target.value)}
                    placeholder="e.g. discord_channel_id or webhook URL"
                    className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-mono"
                  />
                </div>
              </div>

              {/* Baseline Telemetry Checkbox */}
              <div
                onClick={() => setSeedBaselineScenario(!seedBaselineScenario)}
                className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-2xl flex items-start gap-3.5 cursor-pointer hover:border-indigo-500 transition"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 transition ${
                    seedBaselineScenario
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-700 bg-slate-900'
                  }`}
                >
                  {seedBaselineScenario ? '✓' : ''}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Initialize Workspace with Live Mirrored Sandbox Telemetry</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Automatically seeds 27 multi-stage findings, maps your DMZ and crown jewel targets into the Cytoscape graph, and generates your first correlated attack path so you can immediately plan and verify in the lab.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOnboarding}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Finalize & Launch Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

