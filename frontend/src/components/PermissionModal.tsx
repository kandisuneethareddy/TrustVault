import React, { useState, useEffect } from 'react';
import { X, KeyRound, UserCheck, UserMinus, ShieldAlert, CheckCircle2, Clock, Plus } from './icons';
import { DocumentItem, PermissionGrant, User } from '../types';
import { api } from '../services/api';

interface PermissionModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  document,
  isOpen,
  onClose,
  currentUser,
}) => {
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [accessLevel, setAccessLevel] = useState<'READ' | 'EDIT'>('READ');
  const [validUntil, setValidUntil] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPermissionsAndUsers = async () => {
    if (!document) return;
    try {
      setIsLoading(true);
      const [permsRes, usersRes] = await Promise.all([
        api.listPermissions(document.id),
        api.listUsers(),
      ]);
      setPermissions(permsRes.permissions);
      // Filter out owner from selectable grant users
      setAllUsers(usersRes.users.filter(u => u.id !== currentUser?.id && u.id !== document.ownerId));
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load permissions', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      setStatusMessage(null);
      fetchPermissionsAndUsers();
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setStatusMessage({ text: 'Please select a user to grant access', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage(null);
      await api.grantPermission({
        documentId: document.id,
        targetUserId: selectedUserId,
        accessLevel,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      });

      setStatusMessage({ text: 'Permission successfully granted and recorded in audit ledger.', type: 'success' });
      setSelectedUserId('');
      setValidUntil('');
      await fetchPermissionsAndUsers();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Grant failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantRevoke = async (targetUserId: string, userName: string) => {
    try {
      setRevokingId(targetUserId);
      setStatusMessage(null);
      
      const res = await api.revokePermission(document.id, targetUserId);

      setStatusMessage({
        text: `⚡ Instant Revocation Complete: Access severed for ${userName}. All server-side requests will fail immediately.`,
        type: 'success',
      });

      await fetchPermissionsAndUsers();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Revocation failed', type: 'error' });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-50 to-pink-50 text-purple-700 border border-purple-200 shadow-2xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Sharing & Permissions</h2>
              <p className="text-[11px] text-slate-500">
                Document: <span className="text-slate-800 font-semibold">{document.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
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

        {/* Grant New Permission Form */}
        <form onSubmit={handleGrant} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-sky-600" />
            Share with a Colleague
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Employee</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Choose Colleague --</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">What can they do?</label>
              <select
                value={accessLevel}
                onChange={e => setAccessLevel(e.target.value as 'READ' | 'EDIT')}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="READ">Can View Only (Read & Download)</option>
                <option value="EDIT">Can View & Edit (Modify details)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Expires On (Optional)</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLoading || !selectedUserId}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1.5 shadow-md shadow-sky-500/25 cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Grant Access</span>
            </button>
          </div>
        </form>

        {/* Active Named Grants List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>People Who Currently Have Access ({permissions.length})</span>
            <span className="text-[10px] text-emerald-700 font-medium">⚡ Revocation takes effect in 0 seconds</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden max-h-60 overflow-y-auto shadow-2xs">
            {permissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No external colleagues have access. Only you (the document owner) can open this file.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Person</th>
                    <th className="py-2.5 px-3">Access Level</th>
                    <th className="py-2.5 px-3">Access Duration</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{perm.userName}</div>
                        <div className="text-[10px] text-slate-500">
                          {perm.userEmail} · {perm.userDepartment}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
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

                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {perm.validUntil ? (
                          <div className="flex items-center gap-1 text-amber-700 font-medium">
                            <Clock className="h-3 w-3" />
                            <span>Expires {new Date(perm.validUntil).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Always active</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleInstantRevoke(perm.userId, perm.userName)}
                          disabled={revokingId === perm.userId}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-[11px] font-semibold transition flex items-center gap-1 ml-auto cursor-pointer"
                          title="Stops their access right away"
                        >
                          <UserMinus className="h-3 w-3" />
                          <span>{revokingId === perm.userId ? 'Stopping...' : 'Revoke Access Now'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
