import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, AlertCircle, RefreshCw, Hash, Lock, CheckCircle2 } from 'lucide-react';
import { AuditEvent } from '../types';
import { fetchAuditEvents, verifyAuditLedger } from '../api';

export const Audit: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadEvents();
    runVerification();
  }, []);

  const loadEvents = async () => {
    const data = await fetchAuditEvents();
    setEvents(data || []);
  };

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await verifyAuditLedger();
      setVerification(res);
    } catch (err) {
      console.error('Audit verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
            <span className="text-white font-semibold">SECURITY PROOFS</span> // SHA-256 LEDGER
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span>Cryptographic Audit Ledger</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Append-only SHA-256 hash chain recording every ingestion, correlation, approval, and execution event.
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={verifying}
          className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-mono font-bold px-4 py-2 rounded-xl text-xs tracking-wider transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
          <span>VERIFY INTEGRITY</span>
        </button>
      </div>

      {/* Verification Status Badge */}
      {verification && (
        <div className="border border-white bg-black rounded-xl p-4 flex items-center justify-between font-mono text-xs text-white">
          <div className="flex items-center gap-3">
            {verification.valid ? (
              <ShieldCheck className="w-7 h-7 flex-shrink-0 text-white" />
            ) : (
              <AlertCircle className="w-7 h-7 flex-shrink-0 text-neutral-400" />
            )}
            <div>
              <h3 className="font-bold text-xs uppercase text-white font-mono">
                {verification.valid
                  ? 'Cryptographic Chain Integrity Verified'
                  : 'Ledger Tamper Detected!'}
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                {verification.events} events verified without broken links • Head Hash: <span className="text-white">{verification.head_hash.slice(0, 24)}...</span>
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-white text-black font-bold uppercase">
            {verification.valid ? 'TAMPER-EVIDENT' : 'CORRUPTED'}
          </span>
        </div>
      )}

      {/* Event Timeline Table */}
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl overflow-hidden text-xs">
        <div className="p-4 bg-black border-b border-[#262626] flex justify-between items-center font-mono">
          <span className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider">Historical Audit Event Records</span>
          <span className="text-neutral-400 text-[11px]">{events.length} Sealed Entries</span>
        </div>

        <div className="divide-y divide-[#262626] max-h-[500px] overflow-y-auto font-mono">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 hover:bg-white/[0.04] transition space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-black border border-white text-white flex items-center justify-center font-bold text-[10px]">
                    #{ev.id}
                  </span>
                  <span className="text-white font-bold text-xs">{ev.type}</span>
                  <span className="text-neutral-500 text-[10px]">by {ev.actor}</span>
                </div>
                <span className="text-neutral-500 text-[10px]">{ev.ts}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-neutral-400 pt-1">
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">PAYLOAD DETAILS:</span>
                  <span className="text-neutral-300 truncate block">
                    {JSON.stringify(ev.payload).slice(0, 80)}...
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">PREVIOUS LINK HASH:</span>
                  <span className="text-neutral-400 truncate block">{ev.prev_hash}</span>
                </div>
              </div>

              <div className="bg-black border border-[#262626] p-2 rounded-lg text-[10px] text-neutral-400 flex items-center justify-between">
                <span className="truncate flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-white inline" />
                  <span>Sealed SHA-256: {ev.hash}</span>
                </span>
                <span className="text-white font-semibold text-[10px] flex-shrink-0 ml-2">✓ Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
