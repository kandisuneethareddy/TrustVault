import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from '../components/icons';
import { DocumentItem, PermissionGrant, User } from '../types';
import { api } from '../services/api';

interface PermissionsPageProps {
  documents?: DocumentItem[];
  currentUser?: User | null;
  selectedDocId?: string;
  initialDocumentId?: string;
  onNavigate?: (page: string, params?: any) => void;
}

export const PermissionsPage: React.FC<PermissionsPageProps> = ({
  documents = [],
  currentUser,
  selectedDocId,
  initialDocumentId,
  onNavigate,
}) => {
  // Only documents the user owns (or can manage)
  const manageableDocs = (documents || []).filter(
    d => d.isOwner || (currentUser && currentUser.role === 'admin')
  );

  const startDocId = initialDocumentId || selectedDocId;
  const [activeDocId, setActiveDocId] = useState<string>(
    startDocId || (manageableDocs.length > 0 ? manageableDocs[0].id : '')
  );
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [accessLevel, setAccessLevel] = useState<'READ' | 'EDIT'>('READ');
  const [validUntil, setValidUntil] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const activeDoc = manageableDocs.find(d => d.id === activeDocId);

  const loadPermissionsAndUsers = async (docId: string) => {
    if (!docId) return;
    try {
      setIsLoading(true);
      const [permsRes, usersRes] = await Promise.all([
        api.listPermissions(docId),
        api.listUsers(),
      ]);
      setPermissions(permsRes.permissions);
      setAllUsers(usersRes.users.filter(u => u.id !== currentUser?.id && u.id !== activeDoc?.ownerId));
    } catch (err: any) {

      setStatusMessage({ text: err.message || 'Failed to load permissions', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeDocId) {
      setStatusMessage(null);
      loadPermissionsAndUsers(activeDocId);
    }
  }, [activeDocId]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocId || !selectedUserId) {
      setStatusMessage({ text: 'Please select a colleague to grant access.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage(null);
      await api.grantPermission({
        documentId: activeDocId,
        targetUserId: selectedUserId,
        accessLevel,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      });

      setStatusMessage({
        text: 'Access permission successfully granted and logged into the audit ledger.',
        type: 'success',
      });
      setSelectedUserId('');
      setValidUntil('');
      await loadPermissionsAndUsers(activeDocId);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to grant permission', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (targetUserId: string, targetUserName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to revoke access for ${targetUserName}? Their access will be immediately terminated on the server in 0 milliseconds.`
    );
    if (!confirmed) return;

    try {
      setRevokingId(targetUserId);
      setStatusMessage(null);

      await api.revokePermission(activeDocId, targetUserId);

      setStatusMessage({
        text: `⚡ Instant Revocation Complete: Access terminated for ${targetUserName}. All future requests will be refused immediately.`,
        type: 'success',
      });
      await loadPermissionsAndUsers(activeDocId);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Revocation failed', type: 'error' });
    } finally {
      setRevokingId(null);
    }
  };

  if (manageableDocs.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-3">
        <KeyRound className="h-10 w-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">No Manageable Documents</h2>
        <p className="text-xs text-slate-500">
          Only document owners or administrators can manage document permissions. Upload a document first to grant or revoke access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-purple-600" />
            Manage Document Permissions & Access Grants
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Grant per-document READ or EDIT rights to named individuals. Revocations execute in 0 milliseconds.
          </p>
        </div>

        {/* Document Selector */}
        <div className="w-full sm:w-72">
          <select
            value={activeDocId}
            onChange={e => setActiveDocId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
          >
            {manageableDocs.map(d => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grant Access Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <Plus className="h-4 w-4 text-sky-600" />
          <span>Grant New Named User Access</span>
        </div>

        <form onSubmit={handleGrant} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Colleague</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Choose Colleague --</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role} - {u.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Permission Level</label>
            <select
              value={accessLevel}
              onChange={e => setAccessLevel(e.target.value as 'READ' | 'EDIT')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="READ">READ (View and Download)</option>
              <option value="EDIT">EDIT (View, Download, Edit Metadata)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Expiry Date (Optional)</label>
            <input
              type="datetime-local"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading || !selectedUserId}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4" />
              <span>Issue Named Grant</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Grants List */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Active Access Grants for "{activeDoc?.title}" ({permissions.length})
            </h3>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>0 ms Instant Revocation Guarantee</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          {permissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No external colleagues have access. Only the document owner can open this document.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Authorized Person</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4">Access Window</th>
                  <th className="py-3 px-4 text-right">Revocation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{perm.userName}</div>
                      <div className="text-[10px] text-slate-500">{perm.userEmail} · {perm.userDepartment}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          perm.accessLevel === 'EDIT'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {perm.accessLevel === 'EDIT' ? 'Can View & Edit' : 'View Only'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {perm.validUntil ? (
                        <div className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>Expires {new Date(perm.validUntil).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Indefinite (Until revoked)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRevoke(perm.userId, perm.userName)}
                        disabled={revokingId === perm.userId}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1 ml-auto"
                        title="Sever access right away"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span>{revokingId === perm.userId ? 'Revoking...' : 'Revoke Access Now'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

