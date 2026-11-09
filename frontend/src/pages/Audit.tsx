import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, AlertCircle, RefreshCw, Hash, Lock } from 'lucide-react';
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
    setEvents(data);
  };

  const runVerification = async () => {
    setVerifying(true);
    const res = await verifyAuditLedger();
    setVerification(res);
    setVerifying(false);
  };

  return (
    <div className="space-y-6">
      <div className="reveal-block flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>Cryptographic Audit Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Append-only SHA-256 hash chain recording every ingestion, correlation, approval, and execution event.
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={verifying}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-xs tracking-wider shadow-sm shadow-indigo-600/20 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
          <span>VERIFY INTEGRITY</span>
        </button>
      </div>

      {/* Verification Status Badge */}
      {verification && (
        <div
          className={`reveal-block border rounded-2xl p-5 flex items-center justify-between shadow-sm ${
            verification.valid
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {verification.valid ? (
              <ShieldCheck className="w-7 h-7 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-7 h-7 flex-shrink-0 text-rose-600" />
            )}
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                {verification.valid
                  ? 'Cryptographic Chain Integrity Verified'
                  : 'Ledger Tamper Detected!'}
              </h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                {verification.events} events verified without broken links • Head Hash: {verification.head_hash.slice(0, 24)}...
              </p>
            </div>
          </div>
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-white border border-slate-200 font-bold shadow-xs">
            {verification.valid ? 'TAMPER-EVIDENT' : 'CORRUPTED'}
          </span>
        </div>
      )}

      {/* Event Timeline Table */}
      <div className="reveal-block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm text-xs">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex justify-between items-center font-mono">
          <span className="font-bold text-slate-700 uppercase text-[11px]">Audit Event Hash Chain</span>
          <span className="text-slate-500">{events.length} Historical Records</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto font-mono">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 hover:bg-slate-50/70 transition space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                    #{ev.id}
                  </span>
                  <span className="text-slate-800 font-bold text-xs">{ev.type}</span>
                  <span className="text-slate-500 text-[10px]">by {ev.actor}</span>
                </div>
                <span className="text-slate-400 text-[10px]">{ev.ts}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">PAYLOAD DETAILS:</span>
                  <span className="text-slate-700 truncate block">
                    {JSON.stringify(ev.payload).slice(0, 70)}...
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PREVIOUS HASH:</span>
                  <span className="text-slate-600 truncate block">{ev.prev_hash}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-[10px] text-slate-500 flex items-center justify-between">
                <span className="truncate flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-indigo-500 inline" />
                  <span>Hash: {ev.hash}</span>
                </span>
                <span className="text-emerald-600 font-semibold text-[10px] flex-shrink-0 ml-2">✓ Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
