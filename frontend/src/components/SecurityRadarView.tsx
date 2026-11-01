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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radar className="h-5 w-5 text-red-400" />
            Security Command Center & Telemetry
          </h1>
          <p className="text-xs text-slate-400">
            Real-time perimeter monitoring, breach attempt surveillance, and global session governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleGlobalRevokeSessions}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 text-amber-300 font-semibold text-xs transition"
          >
            <KeyRound className="h-4 w-4" />
            <span>Revoke All Sessions</span>
          </button>
        </div>
      </div>

      {revokeNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{revokeNotice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Encrypted Documents</span>
            <Files className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.metrics.totalDocuments ?? 0}
          </div>
          <div className="text-[10px] text-slate-500">AES-256-GCM Vault</div>
        </div>

        {/* Active Users */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Authorized Accounts</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.metrics.totalUsers ?? 0}
          </div>
          <div className="text-[10px] text-slate-500">Admin, Owner, Viewer roles</div>
        </div>

        {/* Refused Breach Attempts */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Repelled Breach Probes</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            {stats?.metrics.refusedBreachAttempts ?? 0}
          </div>
          <div className="text-[10px] text-red-400/80">Refused and logged</div>
        </div>

        {/* Cryptographic Ledger Status */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ledger Blocks</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats?.metrics.totalAuditLedgerBlocks ?? 0}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">100% Cryptographically Verified</div>
        </div>
      </div>

      {/* Refused Breach Attempts Live Surveillance Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <h2 className="text-sm font-bold text-white">Live Unauthorized Access Refusal Stream</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Recorded in immutable ledger with IP & user identity
          </span>
        </div>

        <div className="rounded-2xl border border-red-950/60 bg-red-950/10 overflow-hidden">
          {refusedAttempts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No refused breach attempts recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-red-900/20 max-h-80 overflow-y-auto text-xs">
              {refusedAttempts.map(attempt => (
                <div key={attempt.id} className="p-3.5 hover:bg-red-950/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                        {attempt.action} REFUSED
                      </span>
                      <span className="font-semibold text-slate-200">
                        {attempt.userEmail || 'Unauthenticated Attacker'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Role: {attempt.userRole || 'None'})
                      </span>
                    </div>

                    <div className="text-[11px] text-red-300 font-medium">
                      {attempt.reason}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-400" />
                        IP: {attempt.ipAddress}
                      </span>
                      {attempt.resourceId && <span>Target: {attempt.resourceId}</span>}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                    <div className="flex items-center gap-1 text-slate-400 sm:justify-end">
                      <Clock className="h-3 w-3" />
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
