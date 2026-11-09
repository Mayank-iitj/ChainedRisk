import React from 'react';
import { Terminal, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

interface ConsoleProps {
  logs: string[];
  executionVerdict: string;
  isExecuting: boolean;
  onClearLogs: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, executionVerdict, isExecuting, onClearLogs }) => {
  return (
    <div className="space-y-6 pb-8">
      <div className="reveal-block flex justify-between items-center">
        <div>
          <div className="text-xs font-semibold text-[#64748b]">
            <span className="text-[#6366f1] font-bold">Execution Engine</span> / Live Telemetry
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mt-0.5 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#6366f1]" />
            <span>Sandbox Execution Console</span>
          </h2>
          <p className="text-xs text-[#64748b]">
            Hardened runner container attached exclusively to isolated <code className="bg-[#ede9fe] text-[#6366f1] px-1.5 py-0.5 rounded font-mono font-bold">chained_lab</code> network.
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="px-3.5 py-1.5 bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#475569] rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
        >
          Clear Output
        </button>
      </div>

      {/* Verdict Banner */}
      {executionVerdict && (
        <div
          className={`reveal-block border rounded-2xl p-5 flex items-center justify-between shadow-card ${
            executionVerdict === 'confirmed'
              ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
              : executionVerdict === 'blocked_by_policy'
              ? 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
              : 'bg-[#fffbeb] border-[#fef3c7] text-[#92400e]'
          }`}
        >
          <div className="flex items-center gap-3">
            {executionVerdict === 'confirmed' ? (
              <CheckCircle2 className="w-7 h-7 text-[#10b981] flex-shrink-0" />
            ) : (
              <AlertOctagon className="w-7 h-7 text-[#ef4444] flex-shrink-0" />
            )}
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono">
                VERDICT: {executionVerdict.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs opacity-90">
                {executionVerdict === 'confirmed'
                  ? 'All precondition steps and network reachability confirmed in lab environment.'
                  : 'Action was denied by policy or execution halted.'}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-white border border-current font-bold uppercase shadow-sm">
            {executionVerdict}
          </span>
        </div>
      )}

      {/* Terminal Window */}
      <div className="reveal-block bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl font-mono text-xs border border-slate-800">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-[11px] ml-2 text-slate-300 font-semibold">chainedrisk-runner@isolated-lab:~</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {isExecuting ? (
              <span className="text-[#38bdf8] flex items-center gap-1.5 animate-pulse font-bold">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
                RUNNER STREAMING
              </span>
            ) : (
              <span className="text-slate-400">READY</span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-1.5 min-h-[380px] max-h-[500px] overflow-y-auto leading-relaxed text-slate-300">
          {logs.length === 0 ? (
            <div className="text-slate-400 italic">
              [*] Waiting for approved execution dispatch...
              <br />
              [*] Container specs: Non-root UID 10001, --read-only, --cap-drop ALL, no egress gateway.
            </div>
          ) : (
            logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('[+]')
                    ? 'text-[#34d399]'
                    : line.includes('[*]')
                    ? 'text-[#38bdf8]'
                    : line.includes('VERDICT')
                    ? 'text-white font-bold bg-slate-800 p-1.5 rounded'
                    : 'text-slate-300'
                }
              >
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
