import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { DocumentsView } from './components/DocumentsView';
import { UploadModal } from './components/UploadModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { PermissionModal } from './components/PermissionModal';
import { AiAdvisoryModal } from './components/AiAdvisoryModal';
import { AuditLedgerView } from './components/AuditLedgerView';
import { SecurityRadarView } from './components/SecurityRadarView';
import { ThreatsView } from './components/ThreatsView';
import { DocumentItem, User } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'documents' | 'audit' | 'security' | 'threats'>('documents');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [ledgerVerified, setLedgerVerified] = useState(true);
  const [refusedCount, setRefusedCount] = useState(0);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [permissionsDoc, setPermissionsDoc] = useState<DocumentItem | null>(null);
  const [aiDoc, setAiDoc] = useState<DocumentItem | null>(null);
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Initial initialization
  useEffect(() => {
    // If no token, default to Alice (Document Owner) for immediate presentation
    const token = api.getToken();
    if (!token) {
      handleSwitchPersona('alice@trustvault.corp');
    } else {
      api
        .getMe()
        .then(res => {
          setCurrentUser(res.user);
          loadDocuments();
          checkTelemetry();
        })
        .catch(() => {
          handleSwitchPersona('alice@trustvault.corp');
        });
    }

    const handleAuthRevoked = (e: any) => {
      alert(`⚠️ ${e.detail || 'Session was revoked by server.'}`);
      setCurrentUser(null);
    };

    window.addEventListener('trustvault_auth_revoked', handleAuthRevoked);
    return () => window.removeEventListener('trustvault_auth_revoked', handleAuthRevoked);
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await api.listDocuments();
      setDocuments(res.documents);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const checkTelemetry = async () => {
    try {
      const verifyRes = await api.verifyLedger();
      setLedgerVerified(verifyRes.verification.isValid);

      const refusedRes = await api.queryAuditLogs({ status: 'REFUSED', limit: 1 });
      setRefusedCount(refusedRes.total);
    } catch (err) {
      // Non-admin might not have full stats, which is expected
    }
  };

  const handleSwitchPersona = async (email: string) => {
    try {
      const res = await api.demoSwitch(email);
      setCurrentUser(res.user);
      await loadDocuments();
      await checkTelemetry();
    } catch (err: any) {
      alert(`Failed to switch persona: ${err.message}`);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
    setDocuments([]);
  };

  const handleUploadSubmit = async (formData: FormData) => {
    await api.uploadDocument(formData);
    await loadDocuments();
    await checkTelemetry();
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const blob = await api.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download Refused: ${err.message}`);
      await checkTelemetry();
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    const confirm = window.confirm(
      `Are you sure you want to permanently delete '${doc.title}'? The encrypted ciphertext will be securely expunged.`
    );
    if (!confirm) return;

    try {
      await api.deleteDocument(doc.id);
      await loadDocuments();
      await checkTelemetry();
    } catch (err: any) {
      alert(`Delete Refused: ${err.message}`);
    }
  };

  const handleStartEdit = (doc: DocumentItem) => {
    setEditDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description);
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    try {
      await api.updateDocument(editDoc.id, {
        title: editTitle,
        description: editDescription,
      });
      setEditDoc(null);
      await loadDocuments();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* Executive Top Navigation */}
      <TopNav
        currentUser={currentUser}
        onSwitchPersona={handleSwitchPersona}
        onLogout={handleLogout}
        onOpenRevokeSessions={() => {
          if (window.confirm('Invalidate all active sessions across all devices for this account?')) {
            api.revokeAllSessions().then(() => alert('All active sessions invalidated.'));
          }
        }}
        ledgerVerified={ledgerVerified}
        totalRefused={refusedCount}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser?.role || 'viewer'}
          documentsCount={documents.length}
          refusedCount={refusedCount}
        />

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'documents' && (
            <DocumentsView
              documents={documents}
              currentUser={currentUser}
              onOpenUpload={() => setUploadModalOpen(true)}
              onPreview={doc => setPreviewDoc(doc)}
              onDownload={handleDownload}
              onOpenPermissions={doc => setPermissionsDoc(doc)}
              onOpenAiAdvisory={doc => setAiDoc(doc)}
              onDelete={handleDelete}
              onUpdate={handleStartEdit}
              isLoading={isLoadingDocs}
            />
          )}

          {currentTab === 'audit' && <AuditLedgerView />}

          {currentTab === 'security' && <SecurityRadarView />}

          {currentTab === 'threats' && <ThreatsView />}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUploadSubmit}
      />

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      <PermissionModal
        isOpen={!!permissionsDoc}
        document={permissionsDoc}
        onClose={() => setPermissionsDoc(null)}
        currentUser={currentUser}
      />

      <AiAdvisoryModal
        isOpen={!!aiDoc}
        document={aiDoc}
        onClose={() => setAiDoc(null)}
        onSuccess={() => {
          loadDocuments();
          checkTelemetry();
        }}
      />

      {/* Edit Metadata Modal */}
      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Edit Document Metadata</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setEditDoc(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
