import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Check, Cpu } from 'lucide-react';

interface IngestProps {
  projectId: string;
  onIngestSuccess: () => void;
}

export const Ingest: React.FC<IngestProps> = ({ projectId, onIngestSuccess }) => {
  const [selectedTool, setSelectedTool] = useState('auto');
  const [selectedStage, setSelectedStage] = useState('auto');
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const tools = [
    { id: 'auto', label: 'Auto Detect' },
    { id: 'nmap', label: 'Nmap (XML/Grep)' },
    { id: 'nuclei', label: 'Nuclei (JSONL)' },
    { id: 'httpx', label: 'HTTPX (JSONL)' },
    { id: 'gitleaks', label: 'Gitleaks (JSON)' },
    { id: 'headers', label: 'Security Headers' },
    { id: 'csv', label: 'Generic CSV' },
    { id: 'native', label: 'Native ChainedRisk JSON' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setReport(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('source_tool', selectedTool);
    formData.append('stage', selectedStage);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/ingest`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setReport(data.result);
      onIngestSuccess();
    } catch (err: any) {
      alert(`Ingest failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="reveal-block">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ingest Assessment Artifacts</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload raw tool exports. ChainedRisk normalizes findings, resolves canonical assets, extracts preconditions/postconditions, and maps attack capabilities.
        </p>
      </div>

      {/* Tool Selector Chips */}
      <div className="reveal-block bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">SOURCE TOOL PARSER</label>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTool(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                selectedTool === t.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div className="reveal-block border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-12 bg-white/70 text-center transition flex flex-col items-center justify-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Drop assessment scan files or click to browse</h3>
          <p className="text-xs text-slate-500 mt-1">Supports Nmap XML, Nuclei JSONL, HTTPX, Gitleaks, CSV, or demo JSON</p>
        </div>

        <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl text-xs tracking-wider shadow-sm shadow-indigo-600/25 transition cursor-pointer">
          <span>SELECT FILES</span>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploading && (
          <div className="text-xs font-medium text-indigo-600 animate-pulse flex items-center gap-2">
            <Cpu className="w-4 h-4 animate-spin" />
            Normalizing findings and redacting secrets...
          </div>
        )}
      </div>

      {/* Ingest Result Report */}
      {report && (
        <div className="reveal-block bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Ingestion & Normalization Complete</span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 block text-[10px]">PARSED FINDINGS</span>
              <span className="text-slate-800 text-base font-bold">{report.findings_created}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 block text-[10px]">NEW ASSETS</span>
              <span className="text-slate-800 text-base font-bold">{report.assets_created}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 block text-[10px]">DUPLICATES DISCARDED</span>
              <span className="text-slate-800 text-base font-bold">{report.duplicates_skipped ?? report.duplicates ?? 0}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 block text-[10px]">SECRETS REDACTED</span>
              <span className="text-indigo-600 text-base font-bold">{report.secrets_redacted_count ?? report.secrets_redacted ?? 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
