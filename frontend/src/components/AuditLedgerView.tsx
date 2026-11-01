import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Fingerprint,
  Link,
  Flame,
} from './icons';
import { AuditLog, VerificationResult } from '../types';
import { api } from '../services/api';

export const AuditLedgerView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [tamperReport, setTamperReport] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.queryAuditLogs({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        limit: 100,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, actionFilter]);

  const handleVerifyLedger = async () => {
    try {
      setIsVerifying(true);
      const res = await api.verifyLedger();
      setVerification(res.verification);
      setShowVerifyModal(true);
      await fetchLogs();
    } catch (err: any) {
      alert(`Ledger verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!logs.length) return;
    const targetBlock = logs[logs.length - 1].sequenceNumber; // pick an existing block
    const confirmTamper = window.confirm(
      `[HACKATHON DEMO] This will deliberately alter block sequence #${targetBlock} in the SQLite database to simulate an insider/attacker modifying an audit record. Are you ready to observe the cryptographic detection?`
    );
    if (!confirmTamper) return;

    try {
      setIsTampering(true);
      const res = await api.simulateTamper(targetBlock, 'FORGED_AUDIT_ACTION_BY_ATTACKER');
      setTamperReport(
        `Attacker executed malicious UPDATE on block #${targetBlock}. Stored row content changed, but cryptographic hash was broken.`
      );
      setVerification(res.integrityCheckAfterAttack);
      setShowVerifyModal(true);
      await fetchLogs();
    } catch (err: any) {
      alert(`Tamper simulation failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await api.exportAudit(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustvault-audit-trail.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            Tamper-Evident Cryptographic Ledger
          </h1>
          <p className="text-xs text-slate-400">
            Immutable SHA-256 block chain. Every upload, access attempt, download, grant, revocation, and refusal is permanently proven.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Verify Ledger Button */}
          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/25"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isVerifying ? 'Verifying Chain...' : 'Verify Ledger Integrity'}</span>
          </button>

          {/* Hackathon Judge Tamper Simulator */}
          <button
            onClick={handleSimulateTamper}
            disabled={isTampering}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 text-amber-300 font-semibold text-xs transition"
            title="Simulate database tampering to test the verification algorithm"
          >
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Simulate Tamper Demo</span>
          </button>

          {/* Export Dropdown */}
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            title="Export CSV audit trail"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor email, action, reason, or resource ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLogs()}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Status: ALL (Success & Refused)</option>
            <option value="SUCCESS">SUCCESS Only</option>
            <option value="REFUSED">REFUSED (Security Alerts) Only</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Action: ALL Events</option>
            <option value="DOCUMENT_DOWNLOAD">Downloads</option>
            <option value="ACCESS_REFUSED">Refused Breaches</option>
            <option value="PERMISSION_REVOKE">Revocations</option>
            <option value="PERMISSION_GRANT">Grants</option>
            <option value="DOCUMENT_UPLOAD">Uploads</option>
            <option value="AI_CLASSIFICATION_REVIEWED">AI Decisions</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-16">Seq #</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Evidentiary Details</th>
                <th className="py-3 px-4 font-mono">SHA-256 Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
                    <div>Loading cryptographic ledger blocks...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isRefused = log.status === 'REFUSED';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isRefused ? 'bg-red-950/10' : ''
                      }`}
                    >
                      {/* Sequence Number */}
                      <td className="py-3 px-3 font-mono text-slate-400 font-bold">
                        #{log.sequenceNumber}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {log.userEmail || 'System Core'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.userRole ? `Role: ${log.userRole}` : 'Unauthenticated'} · IP: {log.ipAddress}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {log.action}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                            isRefused
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 glow-red'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      {/* Details / Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        {isRefused ? (
                          <div className="text-red-400 font-medium text-[11px]">
                            {log.reason || 'Unauthorized access attempt'}
                          </div>
                        ) : (
                          <div className="text-slate-300 text-[11px] truncate">
                            {log.resourceId ? `Resource: ${log.resourceId}` : ''} {log.reason || ''}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {log.metadata}
                        </div>
                      </td>

                      {/* Block Hash */}
                      <td className="py-3 px-4 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 text-blue-400 font-semibold" title={log.hash}>
                          <Fingerprint className="h-3 w-3 shrink-0 text-blue-400" />
                          <span>{log.hash.slice(0, 16)}...</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[9px] mt-0.5" title={log.previousHash}>
                          <Link className="h-2.5 w-2.5 shrink-0" />
                          <span>prev: {log.previousHash.slice(0, 12)}...</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic Verification Modal */}
      {showVerifyModal && verification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    verification.isValid
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {verification.isValid ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Cryptographic Ledger Attestation</h2>
                  <p className="text-[11px] text-slate-400">Complete SHA-256 block-by-block hash verification walk</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {verification.isValid ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Ledger Integrity 100% Cryptographically Verified
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    All {verification.totalRecords} chained blocks were re-computed from Genesis hash. Zero insertions, alterations, or deletions detected.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Chained Blocks Walked:</span>
                    <span className="text-slate-100 font-bold">{verification.totalRecords}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Genesis Anchor Hash:</span>
                    <span className="text-blue-400">{verification.genesisHash.slice(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Latest Chain Tip Hash:</span>
                    <span className="text-emerald-400">{verification.latestHash?.slice(0, 20)}...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 space-y-1 glow-red">
                  <div className="font-bold flex items-center gap-1.5 text-red-400 text-sm">
                    <ShieldAlert className="h-5 w-5" />
                    TAMPER ATTACK DETECTED BY CRYPTOGRAPHIC ENGINE
                  </div>
                  <p className="text-[11px] text-red-200/90">
                    {verification.corruptedBlock?.reason}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">
                    Corrupted Block Details:
                  </div>
                  <div className="text-slate-400">
                    Sequence Number: <span className="text-red-400 font-bold">#{verification.corruptedBlock?.sequenceNumber}</span>
                  </div>
                  <div className="text-slate-400 break-all">
                    Expected Hash: <span className="text-emerald-400">{verification.corruptedBlock?.expectedHash}</span>
                  </div>
                  <div className="text-slate-400 break-all">
                    Corrupted Hash: <span className="text-red-400">{verification.corruptedBlock?.actualHash}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
              >
                Close Verification Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
