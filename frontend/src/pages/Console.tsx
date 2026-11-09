import React from 'react';
import { Terminal, CheckCircle2, AlertOctagon, RefreshCw, Cpu, ShieldAlert } from 'lucide-react';

interface ConsoleProps {
  logs: string[];
  executionVerdict: string;
  isExecuting: boolean;
  onClearLogs: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, executionVerdict, isExecuting, onClearLogs }) => {
  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="reveal-block flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-[#64748B] uppercase">
            <span className="text-[#6366F1] font-semibold">EXECUTION ENGINE</span> // LIVE TELEMETRY
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#6366F1]" />
            <span>Hardened Runner Sandbox Console</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-mono">
            Isolated ephemeral container attached strictly to <code className="bg-[#121821] text-indigo-400 border border-[#1F2A37] px-1.5 py-0.5 rounded font-bold">chained_lab (10.77.0.0/24)</code>.
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="px-3.5 py-1.5 bg-[#121821] border border-[#1F2A37] hover:bg-[#161F2C] text-slate-300 rounded-xl text-xs font-mono font-semibold transition cursor-pointer"
        >
          Clear Stream
        </button>
      </div>

      {/* Verdict Banner */}
      {executionVerdict && (
        <div
          className={`reveal-block border rounded-xl p-4 flex items-center justify-between shadow-card font-mono text-xs ${
            executionVerdict === 'confirmed'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : executionVerdict === 'blocked_by_policy'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {executionVerdict === 'confirmed' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                EXECUTION VERDICT: {executionVerdict.replace(/_/g, ' ')}
              </h3>
              <p className="text-[11px] opacity-80 font-sans mt-0.5">
                {executionVerdict === 'confirmed'
                  ? 'All precondition steps and network reachability confirmed in lab environment.'
                  : 'Action was denied by policy or execution halted.'}
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#0B0F14] border border-current font-bold uppercase shadow-sm">
            {executionVerdict}
          </span>
        </div>
      )}

      {/* Terminal Window */}
      <div className="reveal-block bg-[#070A0E] rounded-xl overflow-hidden shadow-2xl font-mono text-xs border border-[#1F2A37]">
        <div className="bg-[#0B0F14] border-b border-[#1F2A37] px-4 py-3 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="text-[11px] ml-2 text-slate-300 font-semibold font-mono">runner@isolated-lab:~#</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {isExecuting ? (
              <span className="text-cyan-400 flex items-center gap-1.5 animate-pulse font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                RUNNER STREAMING
              </span>
            ) : (
              <span className="text-slate-500">CONTAINER IDLE</span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-1.5 min-h-[380px] max-h-[500px] overflow-y-auto leading-relaxed text-slate-300 bg-[#070A0E]">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic space-y-1 font-mono text-xs">
              <div>[*] Sandbox specifications: Non-root UID 10001, --read-only filesystem, --cap-drop ALL.</div>
              <div>[*] Isolated network: chained_lab (10.77.0.0/24), no default internet egress gateway.</div>
              <div>[*] Awaiting HMAC-SHA256 authorized dispatch token from Approval Queue...</div>
            </div>
          ) : (
            logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('[+]')
                    ? 'text-emerald-400 font-medium'
                    : line.includes('[*]')
                    ? 'text-cyan-400'
                    : line.includes('VERDICT')
                    ? 'text-white font-bold bg-indigo-950/60 p-2 rounded border border-indigo-800'
                    : line.includes('[-] ') || line.includes('ERROR')
                    ? 'text-rose-400'
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
