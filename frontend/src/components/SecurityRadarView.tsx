import React, { useState, useEffect } from 'react';
import {
  Radar,
  ShieldAlert,
  ShieldCheck,
  Users,
  Files,
  KeyRound,
  AlertTriangle,
  Globe,
  Clock,
  RefreshCw,
} from './icons';
import { AdminStats } from '../types';
import { api } from '../services/api';

export const SecurityRadarView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refusedAttempts, setRefusedAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeNotice, setRevokeNotice] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, refusedRes] = await Promise.all([
        api.getAdminStats(),
        api.getRefusedAttempts(),
      ]);
      setStats(statsRes);
      setRefusedAttempts(refusedRes.refusedAttempts);
    } catch (err: any) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleGlobalRevokeSessions = async () => {
    const confirm = window.confirm(
      'Are you sure you want to invalidate all active sessions across all devices? Every user will be forced to re-authenticate immediately.'
    );
    if (!confirm) return;

    try {
      const res = await api.revokeAllSessions();
      setRevokeNotice(res.message);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Session revocation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Radar className="h-5 w-5 text-rose-600" />
            Security Overview
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Live protection status, blocked unauthorized attempts, and company-wide security controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>

          <button
            onClick={handleGlobalRevokeSessions}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-xs transition cursor-pointer"
            title="If any company laptop is lost or compromised, this logs out everyone immediately"
          >
            <KeyRound className="h-4 w-4 text-amber-600" />
            <span>Sign Out All Sessions Company-Wide</span>
          </button>
        </div>
      </div>

      {revokeNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{revokeNotice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Protected Documents</span>
            <Files className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.metrics.totalDocuments ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Encrypted at rest</div>
        </div>

        {/* Active Users */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>User Accounts</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.metrics.totalUsers ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Admins, Owners & Viewers</div>
        </div>

        {/* Refused Breach Attempts */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Blocked Attempts</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {stats?.metrics.refusedBreachAttempts ?? 0}
          </div>
          <div className="text-[10px] text-rose-600/80 font-medium">Stopped & recorded</div>
        </div>

        {/* Cryptographic Ledger Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>History Log Records</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {stats?.metrics.totalAuditLedgerBlocks ?? 0}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">100% Tamper-Proof</div>
        </div>
      </div>

      {/* Refused Breach Attempts Live Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <h2 className="text-sm font-bold text-slate-900">Recent Blocked Unauthorized Attempts</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Permanently saved with user email and IP address
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {refusedAttempts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No unauthorized access attempts recorded yet. All accesses have been authorized.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
              {refusedAttempts.map(attempt => (
                <div key={attempt.id} className="p-3.5 hover:bg-rose-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                        Access Blocked
                      </span>
                      <span className="font-semibold text-slate-900">
                        {attempt.userEmail || 'Unauthenticated User'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({attempt.userRole || 'No role'})
                      </span>
                    </div>

                    <div className="text-[11px] text-rose-700 font-medium">
                      {attempt.reason}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-400" />
                        IP: {attempt.ipAddress}
                      </span>
                      {attempt.resourceId && <span>Target Document ID: {attempt.resourceId}</span>}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    <div className="flex items-center gap-1 text-slate-600 sm:justify-end">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{new Date(attempt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div>{new Date(attempt.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
