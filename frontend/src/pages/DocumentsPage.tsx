import React, { useState } from 'react';
import {
  Files,
  Search,
  UploadCloud,
  FileText,
  Eye,
  Download,
  KeyRound,
  Sparkles,
  Trash2,
  Shield,
  Lock,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  User as UserIcon,
} from '../components/icons';
import { DocumentClassification, DocumentItem, User } from '../types';

interface DocumentsPageProps {
  documents: DocumentItem[];
  currentUser: User | null;
  isLoading: boolean;
  onNavigate: (page: string, params?: any) => void;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onOpenAiAdvisory?: (doc: DocumentItem) => void;
}

type TabType = 'all' | 'my-docs' | 'shared' | 'recent';

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  currentUser,
  isLoading,
  onNavigate,
  onPreview,
  onDownload,
  onDelete,
  onOpenAiAdvisory,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);

  const categories = ['ALL', ...Array.from(new Set(documents.map(d => d.category)))];

  // Tab filter
  const tabFilteredDocs = documents.filter(doc => {
    if (activeTab === 'my-docs') {
      return doc.isOwner;
    }
    if (activeTab === 'shared') {
      return !doc.isOwner && (doc.accessLevel === 'READ' || doc.accessLevel === 'EDIT');
    }
    return true; // 'all' and 'recent'
  });

  // Sort if recent
  const sortedDocs = [...tabFilteredDocs].sort((a, b) => {
    if (activeTab === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // Search & attribute filters
  const filteredDocs = sortedDocs.filter(doc => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q) ||
      doc.fileName.toLowerCase().includes(q) ||
      doc.ownerName.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesClassification =
      selectedClassification === 'ALL' || doc.classification === selectedClassification;

    return matchesSearch && matchesCategory && matchesClassification;
  });

  const getClassificationBadge = (classification: DocumentClassification) => {
    switch (classification) {
      case 'RESTRICTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CONFIDENTIAL':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'INTERNAL':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'PUBLIC':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'OWNER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EDIT':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'READ':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ADMIN_AUDIT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getFriendlyAccessLabel = (level: string) => {
    switch (level) {
      case 'OWNER':
        return 'Document Owner';
      case 'EDIT':
        return 'Can View & Edit';
      case 'READ':
        return 'Can View';
      case 'ADMIN_AUDIT':
        return 'Audit Only (Admin)';
      default:
        return level;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-sky-600 transition cursor-pointer"
            >
              Dashboard
            </button>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">Documents</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Files className="h-6 w-6 text-sky-600" />
            <span>Protected Documents Repository</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Every document is AES-256-GCM encrypted. Access is strictly verified by the server on each request.
          </p>
        </div>

        {currentUser?.role !== 'viewer' && (
          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs transition shadow-md shadow-sky-500/25 cursor-pointer self-start sm:self-auto"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Documents</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] text-slate-700 border border-slate-200">
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my-docs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'my-docs'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>My Documents</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] text-slate-700 border border-slate-200">
            {documents.filter(d => d.isOwner).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('shared')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'shared'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Shared With Me</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] text-slate-700 border border-slate-200">
            {documents.filter(d => !d.isOwner && (d.accessLevel === 'READ' || d.accessLevel === 'EDIT')).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'recent'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Recently Added</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description, or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs transition"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                Department: {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedClassification}
            onChange={e => setSelectedClassification(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs transition"
          >
            <option value="ALL">Sensitivity: ALL</option>
            <option value="RESTRICTED">Restricted (Highest)</option>
            <option value="CONFIDENTIAL">Confidential</option>
            <option value="INTERNAL">Internal</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>
      </div>

      {/* Document List Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Sensitivity</th>
                <th className="py-3.5 px-4">Your Access</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mb-2"></div>
                    <div>Verifying real-time permissions & retrieving documents...</div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    <Shield className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No Documents Found</div>
                    <div className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                      {currentUser?.role === 'viewer' && currentUser?.email === 'eve@untrusted.org'
                        ? 'Access Denied by Design: Eve is an untrusted external identity. Because no document owner has explicitly granted access, zero files can be read or downloaded.'
                        : 'No documents match your active filters, or no files have been shared with your account yet.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-sky-50/30 transition group">
                    {/* Document Title & File Details */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-50 to-pink-50 text-sky-700 border border-sky-200 shrink-0 mt-0.5 shadow-2xs">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <button
                            onClick={() => onNavigate('document-details', { documentId: doc.id })}
                            className="font-bold text-slate-900 group-hover:text-sky-700 hover:underline transition text-left cursor-pointer"
                          >
                            {doc.title}
                          </button>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{doc.description}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {doc.category}
                      </span>
                    </td>

                    {/* Sensitivity */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getClassificationBadge(
                          doc.classification
                        )}`}
                      >
                        {doc.classification}
                      </span>
                    </td>

                    {/* Access Level */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getAccessLevelBadge(
                          doc.accessLevel
                        )}`}
                      >
                        {getFriendlyAccessLabel(doc.accessLevel)}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-semibold">{doc.ownerName}</div>
                      <div className="text-[10px] text-slate-500">{doc.ownerEmail}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open Details */}
                        <button
                          onClick={() => onNavigate('document-details', { documentId: doc.id })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition font-semibold text-[11px] cursor-pointer"
                          title="Open document details"
                        >
                          Details
                        </button>

                        {/* Preview */}
                        <button
                          onClick={() => onPreview(doc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition cursor-pointer"
                          title="Preview document safe in browser"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => onDownload(doc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition cursor-pointer"
                          title="Download encrypted file payload"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* Manage Permissions (Owner Only) */}
                        {doc.isOwner && (
                          <button
                            onClick={() => onNavigate('permissions', { documentId: doc.id })}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
                            title="Manage permissions & instant revocation"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                        )}

                        {/* AI Advisory (Owner Only) */}
                        {doc.isOwner && onOpenAiAdvisory && (
                          <button
                            onClick={() => onOpenAiAdvisory(doc)}
                            className="p-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition cursor-pointer"
                            title="AI Sharing Advisory"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete (Owner or Admin) */}
                        {(doc.isOwner || currentUser?.role === 'admin') && (
                          <button
                            onClick={() => setDeleteConfirmDoc(doc)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Gated by Intentional Action) */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 font-bold">{deleteConfirmDoc.title}</strong>? The AES-256 encrypted payload on disk and all associated permission grants will be permanently purged.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = deleteConfirmDoc;
                  setDeleteConfirmDoc(null);
                  onDelete(target);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

