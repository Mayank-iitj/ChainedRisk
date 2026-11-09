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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
            <span className="text-white font-semibold">EXECUTION ENGINE</span> // LIVE TELEMETRY
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-white" />
            <span>Hardened Runner Sandbox Console</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Isolated ephemeral container attached strictly to <code className="bg-black text-white border border-[#262626] px-1.5 py-0.5 rounded font-bold">chained_lab (10.77.0.0/24)</code>.
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="px-3.5 py-1.5 bg-[#0A0A0A] border border-[#262626] hover:border-white text-white rounded-xl text-xs font-mono font-semibold transition cursor-pointer"
        >
          Clear Stream
        </button>
      </div>

      {/* Verdict Banner */}
      {executionVerdict && (
        <div className="border border-white bg-black rounded-xl p-4 flex items-center justify-between text-white font-mono text-xs">
          <div className="flex items-center gap-3">
            {executionVerdict === 'confirmed' ? (
              <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-neutral-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                EXECUTION VERDICT: {executionVerdict.replace(/_/g, ' ')}
              </h3>
              <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                {executionVerdict === 'confirmed'
                  ? 'All precondition steps and network reachability confirmed in lab environment.'
                  : 'Action was denied by policy or execution halted.'}
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-white text-black font-bold uppercase shadow-sm">
            {executionVerdict}
          </span>
        </div>
      )}

      {/* Terminal Window */}
      <div className="bg-black rounded-xl overflow-hidden font-mono text-xs border border-[#262626]">
        <div className="bg-[#0A0A0A] border-b border-[#262626] px-4 py-3 flex items-center justify-between text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
            <span className="text-[11px] ml-2 text-white font-semibold font-mono">runner@isolated-lab:~#</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {isExecuting ? (
              <span className="text-white flex items-center gap-1.5 animate-pulse font-bold">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                RUNNER STREAMING
              </span>
            ) : (
              <span className="text-neutral-500">CONTAINER IDLE</span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-1.5 min-h-[380px] max-h-[500px] overflow-y-auto leading-relaxed text-neutral-300 bg-black">
          {logs.length === 0 ? (
            <div className="text-neutral-500 italic space-y-1 font-mono text-xs">
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
                    ? 'text-white font-bold'
                    : line.includes('[*]')
                    ? 'text-neutral-300'
                    : line.includes('VERDICT')
                    ? 'text-black font-bold bg-white p-2 rounded'
                    : line.includes('[-] ') || line.includes('ERROR')
                    ? 'text-neutral-400 font-bold underline'
                    : 'text-neutral-300'
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
