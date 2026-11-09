import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Eye, Shield, Tag } from 'lucide-react';
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
    setFindings(data);
  };

  return (
    <div className="space-y-6">
      <div className="reveal-block flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Raw Ingested Findings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Normalized security findings across recon, config-analysis, and vulnerability stages.
          </p>
        </div>
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
          {findings.length} Findings
        </span>
      </div>

      {/* Filters Bar */}
      <div className="reveal-block bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search findings, CWEs, rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Stage Filter */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Stages</option>
          <option value="recon">Recon</option>
          <option value="config">Config</option>
          <option value="vuln">Vulnerability</option>
        </select>

        {/* Severity Filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
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
      <div className="reveal-block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm text-xs">
        <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-200/80 p-4 font-mono text-[11px] text-slate-500 font-semibold">
          <div className="col-span-4">FINDING / TITLE</div>
          <div className="col-span-2">ASSET</div>
          <div className="col-span-2">STAGE</div>
          <div className="col-span-2">SEVERITY</div>
          <div className="col-span-2 text-right">EVIDENCE</div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {findings.map((f) => (
            <div
              key={f.id}
              onClick={() => setInspectFinding(f)}
              className="grid grid-cols-12 p-4 hover:bg-slate-50/70 transition cursor-pointer items-center"
            >
              <div className="col-span-4 pr-3">
                <span className="text-slate-800 font-bold block truncate">{f.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{f.rule_id} • {f.source_tool}</span>
              </div>
              <div className="col-span-2 font-mono text-indigo-600 font-medium truncate">{f.asset_id}</div>
              <div className="col-span-2 font-mono text-slate-600 capitalize">{f.stage}</div>
              <div className="col-span-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    f.severity === 'critical'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : f.severity === 'high'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : f.severity === 'medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {f.severity}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <button className="text-indigo-600 hover:text-indigo-700 font-mono text-[11px] flex items-center gap-1 ml-auto font-medium">
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs transform transition-all">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">{inspectFinding.title}</h3>
              <button
                onClick={() => setInspectFinding(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 font-mono text-slate-600">
              <div><span className="text-slate-400">Finding ID:</span> <span className="text-slate-800 font-medium">{inspectFinding.id}</span></div>
              <div><span className="text-slate-400">Asset:</span> <span className="text-indigo-600 font-medium">{inspectFinding.asset_id}</span></div>
              <div><span className="text-slate-400">Tool:</span> <span className="text-slate-800 font-medium">{inspectFinding.source_tool} ({inspectFinding.rule_id})</span></div>
              <div><span className="text-slate-400">Capabilities Granted:</span> <span className="text-emerald-700 font-medium">{inspectFinding.provides.join(', ') || 'None'}</span></div>
            </div>

            <div>
              <span className="text-slate-500 font-mono block mb-1.5 font-medium">Evidence Snippet (Redacted):</span>
              <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(inspectFinding.evidence, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setInspectFinding(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
