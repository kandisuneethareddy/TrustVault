import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { AiAdvisoryModal } from './components/AiAdvisoryModal';

// Dedicated Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { UploadPage } from './pages/UploadPage';
import { DocumentDetailsPage } from './pages/DocumentDetailsPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { SearchPage } from './pages/SearchPage';
import { AuditPage } from './pages/AuditPage';
import { SecurityAlertsPage } from './pages/SecurityAlertsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ThreatsGuidePage } from './pages/ThreatsGuidePage';
import { ProfilePage } from './pages/ProfilePage';

import { DocumentItem, User } from './types';
import { api } from './services/api';

export type PageId =
  | 'home'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'documents'
  | 'upload'
  | 'document-details'
  | 'permissions'
  | 'search'
  | 'audit'
  | 'security'
  | 'notifications'
  | 'threats'
  | 'profile';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [ledgerVerified, setLedgerVerified] = useState(true);
  const [refusedCount, setRefusedCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Modals (Preview & AI Advisory)
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [aiDoc, setAiDoc] = useState<DocumentItem | null>(null);

  // Initial authentication check
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      // Default to Alice Chen (Document Owner) for immediate presentation
      handleSwitchPersona('alice@trustvault.corp');
    } else {
      api
        .getMe()
        .then(res => {
          setCurrentUser(res.user);
          loadDocuments();
          checkTelemetry();
          loadNotificationCount();
        })
        .catch(() => {
          handleSwitchPersona('alice@trustvault.corp');
        });
    }

    const handleAuthRevoked = (e: any) => {
      alert(`⚠️ ${e.detail || 'Session was revoked by server.'}`);
      setCurrentUser(null);
      setCurrentPage('login');
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
      // Telemetry might be limited for viewers
    }
  };

  const loadNotificationCount = async () => {
    try {
      const res = await api.getNotifications();
      const unread = res.notifications.filter(n => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch {
      // Ignore if not logged in
    }
  };

  const handleSwitchPersona = async (email: string) => {
    try {
      const res = await api.demoSwitch(email);
      setCurrentUser(res.user);
      await loadDocuments();
      await checkTelemetry();
      await loadNotificationCount();
      // Ensure we go to dashboard when switching persona
      setCurrentPage('dashboard');
    } catch (err: any) {
      alert(`Failed to switch persona: ${err.message}`);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
    setDocuments([]);
    setCurrentPage('home');
  };

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page as PageId);
    if (params) {
      setPageParams(params);
    } else {
      setPageParams({});
    }
    // Refresh notifications count periodically on navigation
    loadNotificationCount();
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
      await checkTelemetry();
    } catch (err: any) {
      alert(`Download Refused: ${err.message}`);
      await checkTelemetry();
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    try {
      await api.deleteDocument(doc.id);
      await loadDocuments();
      await checkTelemetry();
    } catch (err: any) {
      alert(`Delete Refused: ${err.message}`);
    }
  };

  // If currently on public pages (home, login, register) without full app chrome
  if (currentPage === 'home') {
    return (
      <HomePage
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onSwitchPersona={handleSwitchPersona}
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onLoginSuccess={user => {
          setCurrentUser(user);
          loadDocuments();
          checkTelemetry();
          setCurrentPage('dashboard');
        }}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={user => {
          setCurrentUser(user);
          loadDocuments();
          checkTelemetry();
          setCurrentPage('dashboard');
        }}
        onNavigate={handleNavigate}
      />
    );
  }

  // Authenticated workspace shell
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Navigation */}
      <TopNav
        currentUser={currentUser}
        onSwitchPersona={handleSwitchPersona}
        onLogout={handleLogout}
        onOpenRevokeSessions={() => {
          if (
            window.confirm(
              'Sign out across all devices? Any open sessions on other computers will stop immediately in 0ms.'
            )
          ) {
            api.revokeAllSessions().then(() => alert('All active sessions have been safely terminated.'));
          }
        }}
        onNavigate={handleNavigate}
        unreadNotifications={unreadNotifications}
        ledgerVerified={ledgerVerified}
        totalRefused={refusedCount}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userRole={currentUser?.role || 'viewer'}
          documentsCount={documents.length}
          refusedCount={refusedCount}
          unreadNotificationsCount={unreadNotifications}
        />

        {/* Dedicated Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              documents={documents}
              onNavigate={handleNavigate}
            />
          )}

          {/* Protected Documents Repository */}
          {currentPage === 'documents' && (
            <DocumentsPage
              documents={documents}
              currentUser={currentUser}
              isLoading={isLoadingDocs}
              onNavigate={handleNavigate}
              onPreview={doc => setPreviewDoc(doc)}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onOpenAiAdvisory={doc => setAiDoc(doc)}
            />
          )}

          {/* Dedicated Upload Page */}
          {currentPage === 'upload' && (
            <UploadPage
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onUploadSuccess={async () => {
                await loadDocuments();
                await checkTelemetry();
              }}
            />
          )}

          {/* Dedicated Document Details Page */}
          {currentPage === 'document-details' && (
            <DocumentDetailsPage
              documentId={pageParams.documentId}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onDownload={handleDownload}
            />
          )}

          {/* Dedicated Permissions & Instant Revocation Page */}
          {currentPage === 'permissions' && (
            <PermissionsPage
              initialDocumentId={pageParams.documentId}
              documents={documents}
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          )}

          {/* Dedicated Search Page */}
          {currentPage === 'search' && (
            <SearchPage
              documents={documents}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onDownload={handleDownload}
            />
          )}

          {/* Dedicated Tamper-Evident Audit Page */}
          {currentPage === 'audit' && (
            <AuditPage onNavigate={handleNavigate} />
          )}

          {/* Dedicated Security Alerts Radar Page */}
          {currentPage === 'security' && (
            <SecurityAlertsPage onNavigate={handleNavigate} />
          )}

          {/* Dedicated Notification Center */}
          {currentPage === 'notifications' && (
            <NotificationsPage
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          )}

          {/* Dedicated Security Model & Threats Guide (THREATS.md) */}
          {currentPage === 'threats' && (
            <ThreatsGuidePage onNavigate={handleNavigate} />
          )}

          {/* Dedicated User Account Profile & Settings */}
          {currentPage === 'profile' && (
            <ProfilePage
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onUserUpdated={user => setCurrentUser(user)}
            />
          )}
        </main>
      </div>

      {/* Document Safe Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      {/* AI Advisory Modal */}
      <AiAdvisoryModal
        isOpen={!!aiDoc}
        document={aiDoc}
        onClose={() => setAiDoc(null)}
        onSuccess={() => {
          loadDocuments();
          checkTelemetry();
        }}
      />
    </div>
  );
};

export default App;
