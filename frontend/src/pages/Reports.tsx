import React from 'react';
import { FileText, Download, Code, ShieldCheck, Check } from 'lucide-react';
import { downloadReport } from '../api';

interface ReportsProps {
  projectId: string;
}

export const Reports: React.FC<ReportsProps> = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="reveal-block">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Security Assessment Reports & SARIF Export</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Export executive assessment reports and standard SARIF 2.1.0 telemetry for GitHub Security / CI/CD pipelines.
        </p>
      </div>

      <div className="reveal-block grid grid-cols-2 gap-6">
        {/* Markdown Executive Report */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-7 space-y-5 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Executive Markdown Report</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Complete briefing containing executive summary, multi-stage attack path diagrams, evidence snippets, human-in-the-loop approval logs, and min-cut remediation action items.
            </p>
          </div>

          <button
            onClick={() => downloadReport(projectId, 'md')}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-xs tracking-wider shadow-sm shadow-indigo-600/25 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD MARKDOWN (.MD)
          </button>
        </div>

        {/* SARIF 2.1.0 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-7 space-y-5 shadow-sm">
          <div className="w-12 h-12 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-center text-violet-600 shadow-xs">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">SARIF 2.1.0 Pipeline Export</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              OASIS SARIF standard format natively consumable by GitHub Code Scanning, GitLab Security Dashboard, and VS Code SARIF viewer. Includes correlated chain rules and severity gains.
            </p>
          </div>

          <button
            onClick={() => downloadReport(projectId, 'sarif')}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-xl text-xs tracking-wider shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD SARIF 2.1.0 (.SARIF)
          </button>
        </div>
      </div>
    </div>
  );
};
