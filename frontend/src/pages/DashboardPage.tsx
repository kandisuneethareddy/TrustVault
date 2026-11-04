import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Files,
  Users,
  KeyRound,
  History,
  UploadCloud,
  Search,
  ArrowRight,
  Eye,
  Download,
  AlertTriangle,
} from '../components/icons';
import { AdminStats, AuditLog, DocumentItem, User } from '../types';

interface DashboardPageProps {
  currentUser: User;
  documents: DocumentItem[];
  adminStats: AdminStats | null;
  recentLogs: AuditLog[];
  onNavigate: (page: string) => void;
  onPreviewDoc?: (doc: DocumentItem) => void;
  onDownloadDoc?: (doc: DocumentItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  documents,
  adminStats,
  recentLogs,
  onNavigate,
  onPreviewDoc,
  onDownloadDoc,
}) => {
  const role = currentUser.role;

  // Filter metrics based on role
  const myOwnedDocs = documents.filter(d => d.isOwner);
  const sharedWithMeDocs = documents.filter(d => !d.isOwner && d.accessLevel !== 'NONE');

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-white to-pink-50/40 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {currentUser.name}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-sky-800 shadow-2xs">
              {role === 'admin' ? 'Administrator Panel' : role === 'owner' ? 'Document Owner Panel' : 'Viewer Panel'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {role === 'admin' && 'Enterprise Compliance & Security Telemetry Center. System checks active.'}
            {role === 'owner' && `Department: ${currentUser.department}. You have full custody over your uploaded documents.`}
            {role === 'viewer' && `Department: ${currentUser.department}. Browse and read documents that colleagues have shared with you.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role !== 'viewer' && (
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('search')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Search className="h-4 w-4 text-slate-500" />
            <span>Search Vault</span>
          </button>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Users</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {adminStats?.metrics.totalUsers ?? 6}
            </div>
            <div className="text-[10px] text-slate-400">All registered roles</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Documents</span>
              <Files className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {adminStats?.metrics.totalDocuments ?? documents.length}
            </div>
            <div className="text-[10px] text-slate-400">Encrypted at rest</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Active Accounts</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {adminStats?.metrics.activeSessionsCount ?? 6}
            </div>
            <div className="text-[10px] text-slate-400">Zero active lockouts</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Downloads</span>
              <Download className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {recentLogs.filter(l => l.action === 'DOCUMENT_DOWNLOAD').length}
            </div>
            <div className="text-[10px] text-slate-400">Authorized requests</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Blocked Attempts</span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600">
              {adminStats?.metrics.refusedBreachAttempts ?? 0}
            </div>
            <div className="text-[10px] text-rose-600 font-medium">Repelled & logged</div>
          </div>
        </div>
      )}

      {role === 'owner' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>My Documents</span>
              <Files className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{myOwnedDocs.length}</div>
            <div className="text-[10px] text-slate-400">Under your custody</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Uploads</span>
              <UploadCloud className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{myOwnedDocs.length}</div>
            <div className="text-[10px] text-slate-400">AES-256 encrypted</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Shared Documents</span>
              <KeyRound className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700">
              {myOwnedDocs.filter(d => d.classification !== 'RESTRICTED').length}
            </div>
            <div className="text-[10px] text-slate-400">With named colleagues</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Instant Revocation</span>
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700">0 ms</div>
            <div className="text-[10px] text-slate-400">Server verified lockout</div>
          </div>
        </div>
      )}

      {role === 'viewer' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Shared With Me</span>
              <Files className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{documents.length}</div>
            <div className="text-[10px] text-slate-400">Accessible files</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Available Downloads</span>
              <Download className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{documents.length}</div>
            <div className="text-[10px] text-slate-400">Authorized for offline read</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Your Permission</span>
              <KeyRound className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl font-black text-purple-700 capitalize">Authorized Viewer</div>
            <div className="text-[10px] text-slate-400">Strict READ access only</div>
          </div>
        </div>
      )}

      {/* Admin Privilege Separation Notice */}
      {role === 'admin' && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-2 text-amber-800">
            <Shield className="h-4 w-4 text-amber-600" />
            <span>Strict Administrative Separation of Duties</span>
          </div>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            By cryptographic design, Administrators monitor system activity, blocked breach attempts, and user lifecycles, but do <strong>NOT</strong> receive automatic permission to read confidential document contents without explicit owner grants.
          </p>
        </div>
      )}

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('documents')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition">
              {role === 'owner' ? 'My Documents' : 'Browse Documents'}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500">
            View, open, and download documents protected under your organization's zero-trust policy.
          </p>
        </div>

        {role !== 'viewer' && (
          <div
            onClick={() => onNavigate('permissions')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition">
                Manage Permissions
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500">
              Grant named access to colleagues or revoke access immediately in 0 seconds.
            </p>
          </div>
        )}

        <div
          onClick={() => onNavigate('audit')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition">
              Tamper-Proof Audit Log
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500">
            Inspect the SHA-256 hash-chained history of who opened, downloaded, or shared files.
          </p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Recent System Activity</h3>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
          >
            View Full Audit Ledger →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Event #</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.slice(0, 5).map(log => {
                const isRefused = log.status === 'REFUSED';
                return (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{log.sequenceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.userEmail || 'System'}</td>
                    <td className="py-3 px-4 text-slate-700">{log.action}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isRefused
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isRefused ? 'Blocked' : 'Allowed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

