import React, { useState } from 'react';
import {
  Search,
  UploadCloud,
  FileText,
  Eye,
  Download,
  KeyRound,
  Sparkles,
  Edit2,
  Trash2,
  Shield,
  Lock,
} from './icons';
import { DocumentClassification, DocumentItem, User } from '../types';

interface DocumentsViewProps {
  documents: DocumentItem[];
  currentUser: User | null;
  onOpenUpload: () => void;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onOpenPermissions: (doc: DocumentItem) => void;
  onOpenAiAdvisory: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onUpdate: (doc: DocumentItem) => void;
  isLoading: boolean;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  currentUser,
  onOpenUpload,
  onPreview,
  onDownload,
  onOpenPermissions,
  onOpenAiAdvisory,
  onDelete,
  onUpdate,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(documents.map(d => d.category)))];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase());

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
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Lock className="h-5 w-5 text-sky-600" />
            Protected Documents
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Files are securely encrypted. Only named users with explicit permission can open or download them.
          </p>
        </div>

        {currentUser?.role !== 'viewer' && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs transition shadow-md shadow-sky-500/25 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* 3 Quick Cards for clarity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Accessible to You</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{filteredDocs.length} Documents</div>
          <div className="text-[10px] text-slate-400 mt-1">Filtered by your role and permissions</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Your Current Role</div>
          <div className="text-lg font-bold text-sky-700 capitalize mt-0.5">{currentUser?.role || 'Viewer'}</div>
          <div className="text-[10px] text-slate-400 mt-1">{currentUser?.department || 'TrustVault User'}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Security Guarantee</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">100% Server Verified</div>
          <div className="text-[10px] text-slate-400 mt-1">Every view is checked & logged in real time</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by document title, keyword, or filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs transition"
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
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs transition"
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
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Sensitivity</th>
                <th className="py-3.5 px-4">Your Permission</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mb-2"></div>
                    <div>Checking permissions and loading documents...</div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    <Shield className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No Documents Accessible</div>
                    <div className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                      {currentUser?.role === 'viewer' && currentUser?.email === 'eve@untrusted.org'
                        ? 'Access Denied by Design: You are signed in as Eve (an external unauthorized user). Because no document owner has shared files with you, zero documents are visible or downloadable.'
                        : 'No documents match your search filters or your account has not been given access to any files yet.'}
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
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition">
                            {doc.title}
                          </div>
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
                        {/* Preview */}
                        <button
                          onClick={() => onPreview(doc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition cursor-pointer"
                          title="Open document safely in browser"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => onDownload(doc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition cursor-pointer"
                          title="Download a copy"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* Manage Permissions (Owner Only) */}
                        {doc.isOwner && (
                          <button
                            onClick={() => onOpenPermissions(doc)}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
                            title="Share or manage permissions"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                        )}

                        {/* AI Advisory (Owner Only) */}
                        {doc.isOwner && (
                          <button
                            onClick={() => onOpenAiAdvisory(doc)}
                            className="p-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition cursor-pointer"
                            title="AI Sharing Recommendations"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}

                        {/* Edit Details */}
                        {(doc.isOwner || doc.accessLevel === 'EDIT') && (
                          <button
                            onClick={() => onUpdate(doc)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                            title="Edit title & description"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {(doc.isOwner || currentUser?.role === 'admin') && (
                          <button
                            onClick={() => onDelete(doc)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                            title="Delete file permanently"
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
    </div>
  );
};
