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

  const getFriendlyActionLabel = (action: string) => {
    switch (action) {
      case 'DOCUMENT_UPLOAD': return 'Uploaded Document';
      case 'DOCUMENT_DOWNLOAD': return 'Downloaded Document';
      case 'DOCUMENT_READ': return 'Viewed Document';
      case 'DOCUMENT_DELETE': return 'Deleted Document';
      case 'DOCUMENT_UPDATE': return 'Updated Document';
      case 'PERMISSION_GRANT': return 'Granted Access';
      case 'PERMISSION_REVOKE': return 'Revoked Access';
      case 'ACCESS_REFUSED': return 'Blocked Attempt';
      case 'AI_CLASSIFICATION_REVIEWED': return 'AI Suggestion Decision';
      case 'AUTH_REVOKE_ALL_SESSIONS': return 'Sessions Reset';
      case 'AUDIT_TAMPER_SIMULATED': return 'Tamper Simulation';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            Activity History & Tamper-Proof Audit Log
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Permanent proof of every upload, view, download, permission change, and blocked unauthorized attempt.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Verify Ledger Button */}
          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isVerifying ? 'Checking History...' : 'Verify History Integrity'}</span>
          </button>

          {/* Hackathon Judge Tamper Simulator */}
          <button
            onClick={handleSimulateTamper}
            disabled={isTampering}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-xs transition cursor-pointer"
            title="Simulate someone attempting to alter the database to see how TrustVault detects it immediately"
          >
            <Flame className="h-4 w-4 text-amber-600" />
            <span>Test Tamper Detection</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200"
            title="Download full history report as CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by person's email, action name, or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLogs()}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs transition"
          >
            <option value="ALL">Status: All (Allowed & Blocked)</option>
            <option value="SUCCESS">Allowed Events Only</option>
            <option value="REFUSED">Blocked Attempts Only</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs transition"
          >
            <option value="ALL">Event Type: All Events</option>
            <option value="DOCUMENT_DOWNLOAD">Downloads</option>
            <option value="ACCESS_REFUSED">Blocked Attempts</option>
            <option value="PERMISSION_REVOKE">Access Revocations</option>
            <option value="PERMISSION_GRANT">Access Grants</option>
            <option value="DOCUMENT_UPLOAD">Uploads</option>
            <option value="AI_CLASSIFICATION_REVIEWED">AI Decisions</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-16">Record #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Tamper Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mb-2"></div>
                    <div>Loading verified history entries...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No activity entries found matching your search.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isRefused = log.status === 'REFUSED';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-sky-50/40 transition ${
                        isRefused ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Sequence Number */}
                      <td className="py-3 px-3 font-mono text-slate-500 font-bold">
                        #{log.sequenceNumber}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {log.userEmail || 'System Core'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {log.userRole ? `Role: ${log.userRole}` : 'External'} · IP: {log.ipAddress}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {getFriendlyActionLabel(log.action)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                            isRefused
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isRefused ? 'Blocked' : 'Allowed'}
                        </span>
                      </td>

                      {/* Details / Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        {isRefused ? (
                          <div className="text-rose-700 font-medium text-[11px]">
                            {log.reason || 'Unauthorized access attempt'}
                          </div>
                        ) : (
                          <div className="text-slate-700 text-[11px] truncate">
                            {log.reason || (log.resourceId ? `Resource: ${log.resourceId}` : 'Authorized request completed')}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                          {log.metadata}
                        </div>
                      </td>

                      {/* Checksum / Hash */}
                      <td className="py-3 px-4 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 text-sky-700 font-semibold" title={log.hash}>
                          <Fingerprint className="h-3 w-3 shrink-0 text-sky-600" />
                          <span>{log.hash.slice(0, 12)}...</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[9px] mt-0.5" title={log.previousHash}>
                          <Link className="h-2.5 w-2.5 shrink-0" />
                          <span>Linked</span>
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

      {/* Verification Modal */}
      {showVerifyModal && verification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    verification.isValid
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {verification.isValid ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">History Verification Report</h2>
                  <p className="text-[11px] text-slate-500">Mathematical proof that no logs have been secretly modified or removed</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {verification.isValid ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    All History Records Are 100% Intact & Verified
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    All {verification.totalRecords} records were checked from beginning to end. Every record is perfectly chained together, proving that not a single word has been changed or deleted.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Activity Records Checked:</span>
                    <span className="text-slate-900 font-bold">{verification.totalRecords}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>First Anchor Record:</span>
                    <span className="text-sky-700 font-mono font-semibold">{verification.genesisHash.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Latest Activity Checksum:</span>
                    <span className="text-emerald-700 font-mono font-semibold">{verification.latestHash?.slice(0, 16)}...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700 text-sm">
                    <ShieldAlert className="h-5 w-5" />
                    Tamper Detected: Someone Altered an Audit Record!
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    TrustVault detected that record sequence #{verification.corruptedBlock?.sequenceNumber} was illegally modified. Because each record is mathematically linked to the next, the tamper was caught immediately.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
                  <div className="text-slate-900 font-bold border-b border-slate-200 pb-1">
                    Tampered Block Information:
                  </div>
                  <div className="text-slate-600">
                    Record Sequence Number: <span className="text-rose-600 font-bold">#{verification.corruptedBlock?.sequenceNumber}</span>
                  </div>
                  <div className="text-slate-600 break-all font-mono text-[10px]">
                    Expected Checksum: <span className="text-emerald-700">{verification.corruptedBlock?.expectedHash}</span>
                  </div>
                  <div className="text-slate-600 break-all font-mono text-[10px]">
                    Corrupted Checksum: <span className="text-rose-600">{verification.corruptedBlock?.actualHash}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
