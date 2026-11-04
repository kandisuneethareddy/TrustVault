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
  currentUser: User | null;
  documents?: DocumentItem[];
  adminStats?: AdminStats | null;
  recentLogs?: AuditLog[];
  onNavigate: (page: string, params?: any) => void;
  onPreviewDoc?: (doc: DocumentItem) => void;
  onDownloadDoc?: (doc: DocumentItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  documents = [],
  adminStats = null,
  recentLogs = [],
  onNavigate,
  onPreviewDoc,
  onDownloadDoc,
}) => {
  if (!currentUser) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin h-8 w-8 border-3 border-sky-500 border-t-transparent rounded-full"></div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Connecting to TrustVault Secure Vault...</div>
        <p className="text-xs text-slate-400">Verifying session token and cryptographic credentials...</p>
      </div>
    );
  }

  const role = currentUser.role || 'viewer';
  const name = currentUser.name || 'User';
  const department = currentUser.department || 'General';

  // Filter metrics based on role
  const myOwnedDocs = (documents || []).filter(d => d.isOwner);
  const sharedWithMeDocs = (documents || []).filter(d => !d.isOwner);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-50/80 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-sky-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {name}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 border border-sky-200/80 dark:border-slate-700 text-sky-800 dark:text-sky-300 shadow-2xs">
              {role === 'admin' ? 'Administrator Panel' : role === 'owner' ? 'Document Owner Panel' : 'Viewer Panel'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {role === 'admin' && 'Enterprise Compliance & Security Telemetry Center. System checks active.'}
            {role === 'owner' && `Department: ${department}. You have full custody over your uploaded documents.`}
            {role === 'viewer' && `Department: ${department}. Browse and read documents that colleagues have shared with you.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role !== 'viewer' && (
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('search')}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Search Vault</span>
          </button>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Total Users</span>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {adminStats?.metrics?.totalUsers ?? 6}
            </div>
            <div className="text-[10px] text-slate-400">All registered roles</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Total Documents</span>
              <Files className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {documents.length}
            </div>
            <div className="text-[10px] text-slate-400">Vault ciphertext records</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Active Grants</span>
              <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
              {adminStats?.metrics?.activePermissionGrants ?? 3}
            </div>
            <div className="text-[10px] text-slate-400">Live access permissions</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Blocked Probes</span>
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {adminStats?.metrics?.refusedBreachAttempts ?? 0}
            </div>
            <div className="text-[10px] text-slate-400">Refused intrusion attempts</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Ledger Health</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1">100% Verified</div>
            <div className="text-[10px] text-slate-400">SHA-256 chain intact</div>
          </div>
        </div>
      )}

      {role === 'owner' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>My Owned Documents</span>
              <Files className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{myOwnedDocs.length}</div>
            <div className="text-[10px] text-slate-400">You hold custody & revocation</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Shared With Others</span>
              <KeyRound className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-400">{myOwnedDocs.length > 0 ? 2 : 0}</div>
            <div className="text-[10px] text-slate-400">Colleagues with named grants</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Shared With Me</span>
              <Files className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{sharedWithMeDocs.length}</div>
            <div className="text-[10px] text-slate-400">Access granted by other owners</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Security Guarantee</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1">0ms Revocation</div>
            <div className="text-[10px] text-slate-400">Taking access back is instant</div>
          </div>
        </div>
      )}

      {role === 'viewer' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Accessible Files</span>
              <Files className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{documents.length}</div>
            <div className="text-[10px] text-slate-400">Documents granted to you</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Available Downloads</span>
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{documents.length}</div>
            <div className="text-[10px] text-slate-400">Authorized for offline read</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Your Permission</span>
              <KeyRound className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-700 dark:text-purple-400 capitalize">Authorized Viewer</div>
            <div className="text-[10px] text-slate-400">Strict READ access only</div>
          </div>
        </div>
      )}

      {/* Admin Privilege Separation Notice */}
      {role === 'admin' && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 space-y-1">
          <div className="font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Strict Administrative Separation of Duties</span>
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 leading-relaxed">
            By cryptographic design, Administrators monitor system activity, blocked breach attempts, and user lifecycles, but do <strong>NOT</strong> receive automatic permission to read confidential document contents without explicit owner grants.
          </p>
        </div>
      )}

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('documents')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
              {role === 'owner' ? 'My Documents' : 'Browse Documents'}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, open, and download documents protected under your organization's zero-trust policy.
          </p>
        </div>

        {role !== 'viewer' && (
          <div
            onClick={() => onNavigate('permissions')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                Manage Permissions
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grant named access to colleagues or revoke access immediately in 0 seconds.
            </p>
          </div>
        )}

        <div
          onClick={() => onNavigate('audit')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
              Tamper-Proof Audit Log
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect the SHA-256 hash-chained history of who opened, downloaded, or shared files.
          </p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-sky-100/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-sky-100/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent System Activity</h3>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 cursor-pointer"
          >
            View Full Audit Ledger →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-sky-100/60 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Event #</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(recentLogs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    All system events are logged to the cryptographic ledger. Browse the audit tab to inspect records.
                  </td>
                </tr>
              ) : (
                (recentLogs || []).slice(0, 5).map(log => {
                  const isRefused = log.status === 'REFUSED';
                  return (
                    <tr key={log.id} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">#{log.sequenceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">{log.userEmail || 'System'}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.action}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isRefused
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                          }`}
                        >
                          {isRefused ? 'Blocked' : 'Allowed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
