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
      const token = localStorage.getItem('cr_auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/v1/projects/${projectId}/ingest`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Upload failed with status ${res.status}`);
      }
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
    <div className="space-y-6 pb-8 select-none">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
          <span className="text-white font-semibold">NORMALIZATION ENGINE</span> // SCAN INGESTION
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-white" />
          <span>Ingest Assessment Artifacts</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5 font-mono">
          Upload raw tool exports. ChainedRisk normalizes findings, resolves canonical assets, extracts preconditions/postconditions, and maps attack capabilities.
        </p>
      </div>

      {/* Tool Selector Chips */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-5 space-y-3 font-mono">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
          SOURCE TOOL PARSER
        </label>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTool(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                selectedTool === t.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-neutral-400 border border-[#262626] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div className="border-2 border-dashed border-[#262626] hover:border-white rounded-xl p-12 bg-[#0A0A0A] text-center transition flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-black border border-white flex items-center justify-center text-white">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white font-mono uppercase">
            Drop assessment scan files or click to browse
          </h3>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Supports Nmap XML, Nuclei JSONL, HTTPX, Gitleaks, CSV, or scenario JSON
          </p>
        </div>

        <label className="bg-white hover:bg-neutral-200 text-black font-mono font-bold px-5 py-2.5 rounded-xl text-xs tracking-wider transition cursor-pointer">
          <span>SELECT ARTIFACT FILES</span>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploading && (
          <div className="text-xs font-mono text-white animate-pulse flex items-center gap-2 pt-2">
            <Cpu className="w-4 h-4 animate-spin" />
            Normalizing findings and redacting secrets...
          </div>
        )}
      </div>

      {/* Ingest Result Report */}
      {report && (
        <div className="bg-[#0A0A0A] border border-white rounded-xl p-6 space-y-4 font-mono">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="uppercase">Ingestion & Normalization Complete</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-black p-3 rounded-lg border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">PARSED FINDINGS</span>
              <span className="text-white text-base font-bold">{report.findings_created}</span>
            </div>
            <div className="bg-black p-3 rounded-lg border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">NEW ASSETS</span>
              <span className="text-white text-base font-bold">{report.assets_created}</span>
            </div>
            <div className="bg-black p-3 rounded-lg border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">DUPLICATES DEDUPLICATED</span>
              <span className="text-white text-base font-bold">{report.duplicates}</span>
            </div>
            <div className="bg-black p-3 rounded-lg border border-[#262626]">
              <span className="text-neutral-500 block text-[10px] uppercase">TOTAL FILES</span>
              <span className="text-white text-base font-bold">{report.files}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
