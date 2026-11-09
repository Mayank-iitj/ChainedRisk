import React from 'react';
import { FileText, Download, Code, ShieldCheck, Check } from 'lucide-react';
import { downloadReport } from '../api';

interface ReportsProps {
  projectId: string;
}

export const Reports: React.FC<ReportsProps> = ({ projectId }) => {
  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="reveal-block">
        <div className="text-[11px] font-mono tracking-wider text-[#64748B] uppercase">
          <span className="text-[#6366F1] font-semibold">SECURITY ARTIFACTS</span> // EXPORTS & PIPELINES
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#6366F1]" />
          <span>Security Assessment Reports & SARIF 2.1.0 Export</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5 font-mono">
          Export executive assessment briefings and standard SARIF 2.1.0 telemetry for GitHub Security and GitLab CI/CD.
        </p>
      </div>

      <div className="reveal-block grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Markdown Executive Report */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-6 space-y-5 shadow-card hover:border-[#2D3A4B] transition">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">Executive Briefing (.MD)</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Complete security assessment report with multi-stage attack path diagrams, human-in-the-loop authorization logs, and min-cut remediation action items.
            </p>
          </div>

          <button
            onClick={() => downloadReport(projectId, 'md')}
            className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-mono font-bold px-4 py-2.5 rounded-xl text-xs tracking-wider shadow-glow-indigo transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD REPORT (.MD)</span>
          </button>
        </div>

        {/* SARIF 2.1.0 */}
        <div className="bg-[#121821] border border-[#1F2A37] rounded-xl p-6 space-y-5 shadow-card hover:border-[#2D3A4B] transition">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">OASIS SARIF 2.1.0 Pipeline Export</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Native standard format consumable by GitHub Advanced Security (Code Scanning), GitLab Security Dashboard, and DefectDojo. Includes correlated chain rules and severity gains.
            </p>
          </div>

          <button
            onClick={() => downloadReport(projectId, 'sarif')}
            className="w-full flex items-center justify-center gap-2 bg-[#161F2C] hover:bg-[#1E293B] text-slate-200 border border-[#2D3A4B] font-mono font-bold px-4 py-2.5 rounded-xl text-xs tracking-wider transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD SARIF 2.1.0 (.SARIF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
