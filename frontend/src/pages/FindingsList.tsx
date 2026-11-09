import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Eye, Shield, Tag, X } from 'lucide-react';
import { Finding } from '../types';
import { fetchFindings } from '../api';

interface FindingsListProps {
  projectId: string;
  initialQuery?: string;
}

export const FindingsList: React.FC<FindingsListProps> = ({ projectId, initialQuery = '' }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [inspectFinding, setInspectFinding] = useState<Finding | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    loadFindings();
  }, [projectId, selectedStage, selectedSeverity, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectFinding) {
        setInspectFinding(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectFinding]);

  const loadFindings = async () => {
    const data = await fetchFindings(projectId, {
      stage: selectedStage || undefined,
      severity: selectedSeverity || undefined,
      q: searchQuery || undefined,
    });
    setFindings(data || []);
  };

  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
            <span className="text-white font-semibold">SECURITY TELEMETRY</span> // FINDINGS POOL
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span>Raw Ingested Findings</span>
            <span className="text-xs font-mono font-bold text-black bg-white px-2.5 py-0.5 rounded-full ml-1">
              {findings.length} Records
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Normalized across recon, config-analysis, and vulnerability stages for graph correlation.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 flex flex-wrap items-center gap-3 text-xs font-mono">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search findings, CWEs, rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-[#262626] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
          />
        </div>

        {/* Stage Filter */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="bg-black border border-[#262626] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-white"
        >
          <option value="">All Stages</option>
          <option value="recon">Stage: Recon</option>
          <option value="config">Stage: Config</option>
          <option value="vuln">Stage: Vulnerability</option>
        </select>

        {/* Severity Filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-black border border-[#262626] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-white"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Findings Table */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl overflow-hidden text-xs font-mono">
        <div className="grid grid-cols-12 bg-black border-b border-[#262626] p-3.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
          <div className="col-span-5">FINDING IDENTITY / TITLE</div>
          <div className="col-span-2">ASSET</div>
          <div className="col-span-2">STAGE</div>
          <div className="col-span-2">SEVERITY</div>
          <div className="col-span-1 text-right">EVIDENCE</div>
        </div>

        <div className="divide-y divide-[#262626] max-h-[540px] overflow-y-auto">
          {findings.map((f) => (
            <div
              key={f.id}
              onClick={() => setInspectFinding(f)}
              className="grid grid-cols-12 p-3.5 hover:bg-white/[0.05] transition cursor-pointer items-center"
            >
              <div className="col-span-5 pr-3">
                <span className="text-white font-semibold block truncate font-sans text-xs">{f.title}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{f.rule_id} • {f.source_tool}</span>
              </div>
              <div className="col-span-2 font-mono text-white font-medium truncate">{f.asset_id}</div>
              <div className="col-span-2 font-mono text-neutral-400 capitalize">{f.stage}</div>
              <div className="col-span-2">
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    f.severity === 'critical'
                      ? 'bg-white text-black font-bold border border-white'
                      : f.severity === 'high'
                      ? 'border-2 border-white text-white font-bold bg-black'
                      : f.severity === 'medium'
                      ? 'border border-neutral-400 text-neutral-200 bg-black'
                      : 'border border-neutral-700 text-neutral-400 bg-black'
                  }`}
                >
                  {f.severity}
                </span>
              </div>
              <div className="col-span-1 text-right">
                <button className="text-white hover:underline font-mono text-[11px] flex items-center gap-1 ml-auto font-medium cursor-pointer">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect Drawer Modal */}
      {inspectFinding && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectFinding(null);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs font-mono text-white">
            <div className="flex justify-between items-center border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white font-sans">{inspectFinding.title}</h3>
              <button
                onClick={() => setInspectFinding(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-neutral-300">
              <div><span className="text-neutral-500">Finding ID:</span> <span className="text-white font-semibold">{inspectFinding.id}</span></div>
              <div><span className="text-neutral-500">Asset:</span> <span className="text-white font-semibold">{inspectFinding.asset_id}</span></div>
              <div><span className="text-neutral-500">Tool / Rule:</span> <span className="text-white">{inspectFinding.source_tool} ({inspectFinding.rule_id})</span></div>
              <div><span className="text-neutral-500">Capabilities Granted:</span> <span className="text-white font-semibold">{inspectFinding.provides.join(', ') || 'None'}</span></div>
            </div>

            <div>
              <span className="text-neutral-400 block mb-1.5 font-bold uppercase text-[10px]">Evidence Payload (Redacted):</span>
              <pre className="bg-black text-neutral-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-[#262626] whitespace-pre-wrap">
                {JSON.stringify(inspectFinding.evidence, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setInspectFinding(null)}
              className="w-full py-2 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition cursor-pointer font-sans"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
