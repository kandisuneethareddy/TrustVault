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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Access Control & Named Grants</h2>
              <p className="text-[11px] text-slate-400">
                Document: <span className="text-slate-200 font-semibold">{document.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/40 border border-red-800/60 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Grant New Permission Form */}
        <form onSubmit={handleGrant} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-blue-400" />
            Grant Access to Named Person
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Select User</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose User --</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role} - {u.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Access Level</label>
              <select
                value={accessLevel}
                onChange={e => setAccessLevel(e.target.value as 'READ' | 'EDIT')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="READ">READ (View & Download)</option>
                <option value="EDIT">EDIT (Read, Download, Edit Metadata)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Expiration (Optional)</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLoading || !selectedUserId}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <UserCheck className="h-4 w-4" />
              <span>Issue Named Grant</span>
            </button>
          </div>
        </form>

        {/* Active Named Grants List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Active Named Permission Grants ({permissions.length})</span>
            <span className="text-[10px] text-slate-500">Instant Revocation Guaranteed</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B0F17] overflow-hidden max-h-60 overflow-y-auto">
            {permissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No external permissions granted. Only the owner can access this document.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Authorized Person</th>
                    <th className="py-2.5 px-3">Access Level</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3 text-right">Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {permissions.map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-100">{perm.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {perm.userEmail} · {perm.userDepartment}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            perm.accessLevel === 'EDIT'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {perm.accessLevel}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {perm.validUntil ? (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Clock className="h-3 w-3" />
                            <span>Expires {new Date(perm.validUntil).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">No expiration (Indefinite)</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleInstantRevoke(perm.userId, perm.userName)}
                          disabled={revokingId === perm.userId}
                          className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 hover:border-red-600 text-[11px] font-medium transition flex items-center gap-1 ml-auto"
                          title="Instantly revoke access: Next request from user will fail immediately"
                        >
                          <UserMinus className="h-3 w-3" />
                          <span>{revokingId === perm.userId ? 'Revoking...' : 'Revoke Instantly'}</span>
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
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
