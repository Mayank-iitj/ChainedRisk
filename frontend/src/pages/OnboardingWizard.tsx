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
  Trash2,
  User,
  BadgeAlert,
  Sliders,
  Globe,
  Key,
  HardDrive
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [provisioningLogs, setProvisioningLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Operator Identity & Organizational Threat Context
  const [operatorName, setOperatorName] = useState(currentUser.full_name || 'Security Operator');
  const [operatorTitle, setOperatorTitle] = useState(currentUser.title || 'Lead SecOps Engineer');
  const [orgName, setOrgName] = useState(currentUser.org_name || 'Enterprise Defense Enclave');
  const [industry, setIndustry] = useState('Financial Services / FinTech');
  const [environment, setEnvironment] = useState('AWS Multi-Account + EKS');
  const [riskTolerance, setRiskTolerance] = useState('standard');

  // Step 2: Perimeter Scope & Ingress DMZ Assets
  const [projectName, setProjectName] = useState(`${orgName} Core Assessment`);
  const [projectDescription, setProjectDescription] = useState(
    'Production-mirrored multi-tier assessment environment with HITL blast-radius gates.'
  );
  const [scopeCidrs, setScopeCidrs] = useState<string[]>(['10.77.0.0/24']);
  const [newCidr, setNewCidr] = useState('');

  // Ingress Assets (Interactive Builder)
  const [ingressNodes, setIngressNodes] = useState<OnboardingAssetInput[]>([
    {
      name: 'gateway-api.dmz',
      ip: '10.77.0.10',
      type: 'Host',
      zone: 'dmz',
      services: ['envoy', 'nginx'],
      datastores: []
    }
  ]);
  const [newIngressName, setNewIngressName] = useState('');
  const [newIngressIp, setNewIngressIp] = useState('');
  const [newIngressServices, setNewIngressServices] = useState('nginx, envoy');

  // Step 3: Crown Jewels & Sensitive Datastores (Interactive Builder)
  const [crownJewels, setCrownJewels] = useState<OnboardingAssetInput[]>([
    {
      name: 'core-cache-cluster.internal',
      ip: '10.77.0.12',
      type: 'Host',
      zone: 'internal',
      services: ['redis'],
      datastores: ['ds_auth_tokens', 'ds_payment_cache']
    },
    {
      name: 'scm-vault.internal',
      ip: '10.77.0.11',
      type: 'Host',
      zone: 'internal',
      services: ['gitlab', 'nginx'],
      datastores: ['ds_source_repo']
    }
  ]);
  const [newJewelName, setNewJewelName] = useState('');
  const [newJewelIp, setNewJewelIp] = useState('');
  const [newJewelServices, setNewJewelServices] = useState('redis');
  const [newJewelDatastores, setNewJewelDatastores] = useState('ds_core_ledger');

  // Step 4: Ingestion Pipeline, Attack Vectors & Safety Gates
  const [selectedScanners, setSelectedScanners] = useState<string[]>([
    'nmap',
    'gitleaks',
    'nuclei',
    'httpx'
  ]);
  const [attackVectors, setAttackVectors] = useState<string[]>([
    'git_leak',
    'ssrf_pivot',
    'creds_exfil',
    'datastore_rce',
    'cors_theft'
  ]);
  const [hitlPolicy, setHitlPolicy] = useState('strict_l1_l2');
  const [notificationChannel, setNotificationChannel] = useState('discord');
  const [notificationWebhook, setNotificationWebhook] = useState(currentUser.discord_id || '');
  const [seedBaselineScenario, setSeedBaselineScenario] = useState(true);

  // Ingress Assets Handlers
  const handleAddIngress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngressName.trim()) return;
    const services = newIngressServices
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const ip = newIngressIp.trim() || `10.77.0.${10 + ingressNodes.length}`;
    setIngressNodes([
      ...ingressNodes,
      {
        name: newIngressName.trim(),
        ip,
        type: 'Host',
        zone: 'dmz',
        services: services.length ? services : ['nginx'],
        datastores: []
      }
    ]);
    setNewIngressName('');
    setNewIngressIp('');
    setNewIngressServices('nginx, envoy');
  };

  const handleRemoveIngress = (index: number) => {
    setIngressNodes(ingressNodes.filter((_, i) => i !== index));
  };

  // Crown Jewels Handlers
  const handleAddJewel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJewelName.trim()) return;
    const services = newJewelServices
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const datastores = newJewelDatastores
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const ip = newJewelIp.trim() || `10.77.0.${12 + crownJewels.length}`;
    setCrownJewels([
      ...crownJewels,
      {
        name: newJewelName.trim(),
        ip,
        type: 'Host',
        zone: 'internal',
        services: services.length ? services : ['redis'],
        datastores: datastores.length ? datastores : ['ds_secure_vault']
      }
    ]);
    setNewJewelName('');
    setNewJewelIp('');
    setNewJewelServices('redis');
    setNewJewelDatastores('ds_core_ledger');
  };

  const handleRemoveJewel = (index: number) => {
    setCrownJewels(crownJewels.filter((_, i) => i !== index));
  };

  const toggleScanner = (scannerId: string) => {
    setSelectedScanners((prev) =>
      prev.includes(scannerId) ? prev.filter((s) => s !== scannerId) : [...prev, scannerId]
    );
  };

  const toggleVector = (vectorId: string) => {
    setAttackVectors((prev) =>
      prev.includes(vectorId) ? prev.filter((v) => v !== vectorId) : [...prev, vectorId]
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
      `TENANT: Setting boundary parameters for "${orgName}" (${industry})`,
      `OPERATOR: Registering credentials for ${operatorName} (${operatorTitle})`,
      `SCOPE: Authorizing CIDR blocks: ${scopeCidrs.join(', ')}`,
      `TOPOLOGY: Provisioning DMZ ingress (${ingressNodes.length} nodes) and Crown Jewels (${crownJewels.length} targets)...`
    ]);

    const payload: OnboardingProfileData = {
      org_name: orgName,
      operator_name: operatorName,
      operator_title: operatorTitle,
      industry,
      environment,
      risk_tolerance: riskTolerance,
      project_name: projectName,
      project_description: projectDescription,
      scope_cidrs: scopeCidrs,
      ingress_assets: ingressNodes,
      crown_jewels: crownJewels,
      active_scanners: selectedScanners,
      attack_vectors_in_scope: attackVectors,
      hitl_gate_policy: hitlPolicy,
      notification_channel: notificationChannel,
      notification_webhook: notificationWebhook,
      seed_baseline_scenario: seedBaselineScenario
    };

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProvisioningLogs((prev) => [
        ...prev,
        `PERIMETER: Binding ingress routes [${ingressNodes.map((n) => n.name).join(', ')}]...`,
        `CROWN JEWELS: Binding high-value datastores [${crownJewels.map((j) => j.name).join(', ')}]...`
      ]);

      await new Promise((r) => setTimeout(r, 700));
      setProvisioningLogs((prev) => [
        ...prev,
        'CORRELATION: Running multi-stage attack path correlator (ChainedRisk Engine)...',
        'HMAC: Generating SHA-256 gated execution keys and verifying blast-radius safety invariants (INV-1..INV-12)...'
      ]);

      const res = await submitOnboarding(payload);

      setProvisioningLogs((prev) => [
        ...prev,
        `COMPLETE: Personalized workspace "${res.project_id}" provisioned successfully. Launching Console...`
      ]);

      await new Promise((r) => setTimeout(r, 600));
      onComplete(res.project_id, res.user);
    } catch (err: any) {
      setError(err.message || 'Onboarding initialization failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-4xl bg-[#0A0A0A] border border-[#262626] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="border-b border-[#262626] px-8 py-6 bg-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white font-mono">ChainedRisk</span>
                <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5 rounded-full font-bold">
                  TAILORED ONBOARDING
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Feed your organization parameters, perimeter ingress, and critical crown jewels.
              </p>
            </div>
          </div>
        </div>

        {/* Step Progress Stepper */}
        {!loading && (
          <div className="px-8 pt-6 pb-2">
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { step: 1, label: '1. Operator & Posture', desc: 'Identity & Risk Policy' },
                { step: 2, label: '2. Ingress Perimeter', desc: 'Scope CIDRs & Gateways' },
                { step: 3, label: '3. Crown Jewels', desc: 'Internal Target Assets' },
                { step: 4, label: '4. Pipeline & Safety', desc: 'Scanners & HITL Gates' }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPast = currentStep > s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => !loading && setCurrentStep(s.step as any)}
                    className={`p-3 rounded-2xl border transition cursor-pointer ${
                      isActive
                        ? 'bg-black border-2 border-white'
                        : isPast
                        ? 'bg-[#141414] border-neutral-700'
                        : 'bg-black border-[#262626] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-white text-black'
                            : isPast
                            ? 'bg-neutral-300 text-black'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {isPast ? '✓' : s.step}
                      </div>
                      <span className="text-xs font-bold text-white">{s.label}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 pl-7">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-black border border-white text-white text-xs rounded-xl flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body or Provisioning State */}
        <div className="p-8">
          {loading ? (
            /* Live Terminal Provisioning State */
            <div className="space-y-4 py-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-black border border-white flex items-center justify-center text-white mx-auto animate-pulse">
                  <Cpu className="w-6 h-6 animate-spin" />
                </div>
                <h4 className="text-base font-extrabold text-white tracking-tight font-mono">
                  Personalizing Telemetry & Correlating Multi-Stage Attack Paths...
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Binding your custom assets, generating tailored CVE telemetry, and verifying HMAC signature gates.
                </p>
              </div>

              {/* Terminal Box */}
              <div className="bg-black border border-[#262626] rounded-2xl p-4 font-mono text-xs text-neutral-200 space-y-1.5 shadow-inner max-h-60 overflow-y-auto">
                {provisioningLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-white font-bold">$</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : currentStep === 1 ? (
            /* Step 1: Operator Identity & Organizational Threat Context */
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Security Operator Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="e.g. Mayank S"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Operator Professional Role / Title *
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={operatorTitle}
                      onChange={(e) => setOperatorTitle(e.target.value)}
                      placeholder="e.g. Lead AppSec / Threat Detection Architect"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Organization / Enterprise Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value);
                        setProjectName(`${e.target.value} Core Assessment`);
                      }}
                      placeholder="e.g. CyberLabs Global"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Industry Vertical *
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white"
                  >
                    <option value="Financial Services / FinTech">Financial Services / FinTech</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Cloud SaaS & Core Infrastructure">Cloud SaaS & Core Infrastructure</option>
                    <option value="E-Commerce & Digital Retail">E-Commerce & Digital Retail</option>
                    <option value="Defense & Critical Infrastructure">Defense & Critical Infrastructure</option>
                    <option value="Autonomous & Robotics Systems">Autonomous & Robotics Systems</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Primary Cloud & Hosting Environment *
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'AWS Multi-Account + EKS', label: 'AWS Multi-Account', icon: Server },
                    { id: 'Google Cloud Platform (GCP) + GKE', label: 'GCP Kubernetes', icon: Layers },
                    { id: 'Microsoft Azure Enterprise', label: 'Azure Enterprise', icon: Globe },
                    { id: 'Hybrid Datacenter / Bare Metal', label: 'Hybrid On-Prem', icon: Database }
                  ].map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setEnvironment(env.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        environment === env.id
                          ? 'bg-black border-2 border-white text-white'
                          : 'bg-black border border-[#262626] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <env.icon className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="text-xs font-bold">{env.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
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
                          ? 'bg-black border-2 border-white text-white'
                          : 'bg-black border border-[#262626] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">{p.title}</span>
                        {riskTolerance === p.id && (
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Next: Ingress Perimeter & Scope</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* Step 2: Perimeter Scope & Interactive Ingress Assets */
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Primary Assessment Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Core Settlement Gateway Assessment"
                    className="w-full px-3.5 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Authorized Scope CIDR Ranges *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCidr}
                      onChange={(e) => setNewCidr(e.target.value)}
                      placeholder="e.g. 10.77.0.0/24 or 172.16.0.0/16"
                      className="flex-1 px-3 py-2 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={addCidr}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-[#262626]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {scopeCidrs.map((cidr) => (
                      <span
                        key={cidr}
                        className="bg-black border border-white text-white text-[10px] font-mono px-2.5 py-0.5 rounded-md flex items-center gap-1.5"
                      >
                        <span>{cidr}</span>
                        {scopeCidrs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCidr(cidr)}
                            className="hover:underline font-bold"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ingress DMZ Assets Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Public DMZ & Ingress Assets ({ingressNodes.length})
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      External entrypoints facing the perimeter where initial vulnerabilities (SSRF, metadata leak) manifest.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIngressNodes([
                          ...ingressNodes,
                          {
                            name: `edge-proxy-${ingressNodes.length + 1}.dmz`,
                            ip: `10.77.0.${10 + ingressNodes.length}`,
                            type: 'Host',
                            zone: 'dmz',
                            services: ['nginx', 'envoy'],
                            datastores: []
                          }
                        ]);
                      }}
                      className="text-[10px] font-mono border border-neutral-700 hover:border-white text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg transition"
                    >
                      + Preset Proxy
                    </button>
                  </div>
                </div>

                {/* List of Ingress Nodes */}
                <div className="space-y-2">
                  {ingressNodes.map((ing, i) => (
                    <div
                      key={i}
                      className="p-3 bg-black border border-[#262626] rounded-xl flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-white font-bold">{ing.name}</div>
                          <div className="text-[10px] text-neutral-400">
                            IP: <span className="text-white">{ing.ip}</span> • Zone: <span className="text-neutral-300">{ing.zone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {ing.services.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-neutral-900 border border-neutral-700 text-neutral-200 px-2 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        {ingressNodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngress(i)}
                            className="p-1 hover:text-white text-neutral-500 transition cursor-pointer"
                            title="Remove asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Add Form for Custom Ingress */}
                <form
                  onSubmit={handleAddIngress}
                  className="p-3 bg-[#0D0D0D] border border-neutral-800 rounded-xl space-y-2 font-mono text-xs"
                >
                  <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Ingress Perimeter Node</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newIngressName}
                      onChange={(e) => setNewIngressName(e.target.value)}
                      placeholder="Hostname (e.g. api-edge.corp.io)"
                      className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                    />
                    <input
                      type="text"
                      value={newIngressIp}
                      onChange={(e) => setNewIngressIp(e.target.value)}
                      placeholder="IP (e.g. 10.77.0.15)"
                      className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                    />
                    <input
                      type="text"
                      value={newIngressServices}
                      onChange={(e) => setNewIngressServices(e.target.value)}
                      placeholder="Services (comma separated)"
                      className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newIngressName.trim()}
                      className="px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold text-[11px] rounded-lg transition disabled:opacity-40"
                    >
                      + Save Ingress Node
                    </button>
                  </div>
                </form>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-[#262626]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Next: Crown Jewels</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* Step 3: Crown Jewels & Sensitive Datastores Builder */
            <div className="space-y-5">
              <div>
                <h5 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-white bg-black" />
                  Internal Crown Jewels & High-Value Targets ({crownJewels.length})
                </h5>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  The mission-critical databases, credential vaults, and source code repositories that attackers pivot toward.
                </p>
              </div>

              {/* List of Crown Jewels */}
              <div className="space-y-2">
                {crownJewels.map((jwl, i) => (
                  <div
                    key={i}
                    className="p-3 bg-black border border-[#262626] rounded-xl flex items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                        <HardDrive className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{jwl.name}</div>
                        <div className="text-[10px] text-neutral-400">
                          IP: <span className="text-white">{jwl.ip}</span> • Engine: <span className="text-neutral-300">{jwl.services.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {jwl.datastores.map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-black border border-white text-white px-2 py-0.5 rounded font-bold"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                      {crownJewels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJewel(i)}
                          className="p-1 hover:text-white text-neutral-500 transition cursor-pointer"
                          title="Remove crown jewel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Add Form for Custom Crown Jewel */}
              <form
                onSubmit={handleAddJewel}
                className="p-3 bg-[#0D0D0D] border border-neutral-800 rounded-xl space-y-2 font-mono text-xs"
              >
                <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Crown Jewel Database / SCM Target</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newJewelName}
                    onChange={(e) => setNewJewelName(e.target.value)}
                    placeholder="Hostname (e.g. pg-payment.internal)"
                    className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                  />
                  <input
                    type="text"
                    value={newJewelIp}
                    onChange={(e) => setNewJewelIp(e.target.value)}
                    placeholder="Internal IP (e.g. 10.77.0.14)"
                    className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                  />
                  <input
                    type="text"
                    value={newJewelServices}
                    onChange={(e) => setNewJewelServices(e.target.value)}
                    placeholder="Service (redis, postgres, vault)"
                    className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                  />
                  <input
                    type="text"
                    value={newJewelDatastores}
                    onChange={(e) => setNewJewelDatastores(e.target.value)}
                    placeholder="Datastores (e.g. ds_vault)"
                    className="px-2.5 py-1.5 bg-black border border-[#262626] rounded-lg text-white focus:outline-none focus:border-white text-xs"
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCrownJewels([
                          ...crownJewels,
                          {
                            name: `postgres-primary-${crownJewels.length + 1}.internal`,
                            ip: `10.77.0.${15 + crownJewels.length}`,
                            type: 'Host',
                            zone: 'internal',
                            services: ['postgres'],
                            datastores: ['ds_customer_pii']
                          }
                        ]);
                      }}
                      className="text-[10px] font-mono border border-neutral-700 hover:border-white text-neutral-300 hover:text-white px-2 py-0.5 rounded transition"
                    >
                      + Preset PostgreSQL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCrownJewels([
                          ...crownJewels,
                          {
                            name: `vault-kms-${crownJewels.length + 1}.internal`,
                            ip: `10.77.0.${18 + crownJewels.length}`,
                            type: 'Host',
                            zone: 'internal',
                            services: ['vault'],
                            datastores: ['ds_kms_keys']
                          }
                        ]);
                      }}
                      className="text-[10px] font-mono border border-neutral-700 hover:border-white text-neutral-300 hover:text-white px-2 py-0.5 rounded transition"
                    >
                      + Preset Vault
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newJewelName.trim()}
                    className="px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold text-[11px] rounded-lg transition disabled:opacity-40"
                  >
                    + Save Crown Jewel
                  </button>
                </div>
              </form>

              {/* Invariant Safety Guarantee */}
              <div className="p-3 bg-black border border-[#262626] rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-neutral-300 font-mono">
                  <Lock className="w-4 h-4 text-white" />
                  <span>
                    INV-2 (Read-Only Safety) & INV-3 (HMAC Verification) automatically enforce strict zero-data-loss boundaries.
                  </span>
                </div>
                <span className="text-black bg-white px-2 py-0.5 rounded font-bold font-mono">ACTIVE</span>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-[#262626]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Next: Pipeline & Safety Gates</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 4: Pipeline Scanners, Attack Vectors & Safety Gates */
            <div className="space-y-5">
              {/* Scanners */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2 font-mono">
                  Connected Vulnerability & Recon Scanners
                </label>
                <div className="grid grid-cols-4 gap-2.5 font-mono">
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
                            ? 'bg-black border-2 border-white text-white'
                            : 'bg-black border border-[#262626] text-neutral-500 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{tool.name}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? 'bg-white text-black' : 'border border-neutral-700'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">{tool.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attack Vector Scope */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2 font-mono">
                  Multi-Stage Attack Vectors in Scope for Correlation
                </label>
                <div className="grid grid-cols-5 gap-2 font-mono text-[11px]">
                  {[
                    { id: 'git_leak', label: 'Git Metadata (.git)' },
                    { id: 'ssrf_pivot', label: 'SSRF Web Proxy' },
                    { id: 'creds_exfil', label: 'Hardcoded Secrets' },
                    { id: 'datastore_rce', label: 'Unauth Datastores' },
                    { id: 'cors_theft', label: 'CORS & Cookie Hijack' }
                  ].map((vec) => {
                    const isSel = attackVectors.includes(vec.id);
                    return (
                      <div
                        key={vec.id}
                        onClick={() => toggleVector(vec.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition ${
                          isSel
                            ? 'bg-white text-black font-bold border-white'
                            : 'bg-black border-[#262626] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {vec.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HITL Safety Policy & Webhook */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    HITL Approval Safety Policy
                  </label>
                  <select
                    value={hitlPolicy}
                    onChange={(e) => setHitlPolicy(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white font-mono"
                  >
                    <option value="strict_l1_l2">Strict Gate: Manual approval required for L1 & L2</option>
                    <option value="hybrid_lab">Lab Auto: Auto-verify L1 read probes; Gate L2 state changes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Approval Channel / Webhook Target
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={notificationChannel}
                      onChange={(e) => setNotificationChannel(e.target.value)}
                      className="w-32 px-2.5 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white"
                    >
                      <option value="discord">Discord</option>
                      <option value="slack">Slack</option>
                      <option value="email">Email</option>
                    </select>
                    <input
                      type="text"
                      value={notificationWebhook}
                      onChange={(e) => setNotificationWebhook(e.target.value)}
                      placeholder="Webhook URL or Channel ID"
                      className="flex-1 px-3 py-2.5 text-xs bg-black border border-[#262626] rounded-xl focus:outline-none focus:border-white text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Baseline Telemetry Checkbox */}
              <div
                onClick={() => setSeedBaselineScenario(!seedBaselineScenario)}
                className="p-4 bg-black border border-white rounded-2xl flex items-start gap-3.5 cursor-pointer hover:bg-neutral-950 transition font-mono"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 transition ${
                    seedBaselineScenario
                      ? 'bg-white text-black font-bold'
                      : 'border border-neutral-700 bg-black'
                  }`}
                >
                  {seedBaselineScenario ? '✓' : ''}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Synthesize & Bind Live Telemetry to Your Configured Perimeter</span>
                    <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-full font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Maps 27 genuine CVE findings directly across your ingress hosts ({ingressNodes.map((i) => i.name).join(', ')}) and crown jewels ({crownJewels.map((j) => j.name).join(', ')}), correlates multi-stage attack paths, and prepares your first gated HITL approval card.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-[#262626]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOnboarding}
                  className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg"
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
