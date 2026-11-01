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
  Filter,
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
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'CONFIDENTIAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'INTERNAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PUBLIC':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'OWNER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'EDIT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'READ':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ADMIN_AUDIT':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-400" />
            Encrypted Document Vault
          </h1>
          <p className="text-xs text-slate-400">
            Per-document granular authorization. Zero plaintext persistence. AES-256-GCM envelope encryption.
          </p>
        </div>

        {currentUser?.role !== 'viewer' && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by document title, keyword, or filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedClassification}
            onChange={e => setSelectedClassification(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">Classification: ALL</option>
            <option value="RESTRICTED">RESTRICTED (Highest)</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="PUBLIC">PUBLIC</option>
          </select>
        </div>
      </div>

      {/* Document List Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Your Access Level</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                    <div>Verifying authorization & decrypting catalog...</div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Shield className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                    <div className="font-semibold text-slate-300">No documents reachable</div>
                    <div className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                      {currentUser?.role === 'viewer' && currentUser?.email === 'eve@untrusted.org'
                        ? 'Zero-Trust Enforcement Active: As an external untrusted user, you have not been granted access to any confidential corporate documents.'
                        : 'No documents match your query or you lack explicit permission grants.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition group">
                    {/* Document Title & File Details */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition">
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{doc.description}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                        {doc.category}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getClassificationBadge(
                          doc.classification
                        )}`}
                      >
                        {doc.classification}
                      </span>
                    </td>

                    {/* Access Level */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getAccessLevelBadge(
                          doc.accessLevel
                        )}`}
                      >
                        {doc.accessLevel}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{doc.ownerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{doc.ownerEmail}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview */}
                        <button
                          onClick={() => onPreview(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Preview document in secure sandbox"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => onDownload(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Download decrypted document"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* Manage Permissions (Owner Only) */}
                        {doc.isOwner && (
                          <button
                            onClick={() => onOpenPermissions(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/50 text-purple-400 hover:text-purple-300 transition"
                            title="Manage named user permissions"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                        )}

                        {/* AI Advisory (Owner Only) */}
                        {doc.isOwner && (
                          <button
                            onClick={() => onOpenAiAdvisory(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-900/50 text-blue-400 hover:text-blue-300 transition"
                            title="AI Classification & Access Suggestion"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}

                        {/* Edit Metadata */}
                        {(doc.isOwner || doc.accessLevel === 'EDIT') && (
                          <button
                            onClick={() => onUpdate(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Edit metadata"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {(doc.isOwner || currentUser?.role === 'admin') && (
                          <button
                            onClick={() => onDelete(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                            title="Expunge document"
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
