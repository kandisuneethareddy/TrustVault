import React, { useState } from 'react';
import { Search, FileText, Lock, Eye, Download, ShieldCheck, Filter } from '../components/icons';
import { DocumentClassification, DocumentItem, User } from '../types';

interface SearchPageProps {
  documents?: DocumentItem[];
  currentUser?: User | null;
  onNavigate?: (page: string, params?: any) => void;
  onPreview?: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  documents = [],
  currentUser,
  onNavigate,
  onPreview,
  onDownload,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedClassification, setSelectedClassification] = useState('ALL');

  const categories = ['ALL', ...Array.from(new Set(documents.map(d => d.category)))];

  const filteredDocs = (documents || []).filter(doc => {

    const matchesQuery =
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.description.toLowerCase().includes(query.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(query.toLowerCase()) ||
      doc.ownerName.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesClassification =
      selectedClassification === 'ALL' || doc.classification === selectedClassification;

    return matchesQuery && matchesCategory && matchesClassification;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="h-5 w-5 text-sky-600" />
          Search Authorized Documents
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Zero-leakage search. You can only discover and search documents you have explicit permission to access.
        </p>
      </div>

      {/* Search Input and Filters */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, department, description, or owner name..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition shadow-2xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Filter by Department</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  Department: {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Filter by Sensitivity</label>
            <select
              value={selectedClassification}
              onChange={e => setSelectedClassification(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Sensitivity: All</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="INTERNAL">Internal</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>Found {filteredDocs.length} matching document(s)</span>
        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Zero information leakage guaranteed
        </span>
      </div>

      {/* Results Cards */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <Lock className="h-8 w-8 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-800 text-sm">No Matching Documents</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No accessible documents matched your search query, or your account does not have permission to view them.
            </p>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-50 to-pink-50 text-sky-700 border border-sky-200 shrink-0 mt-0.5">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900">{doc.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{doc.description || 'No description'}</div>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{doc.ownerName}</span>
                    <span>·</span>
                    <span>{doc.category}</span>
                    <span>·</span>
                    <span className="font-mono">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() =>
                    onPreview
                      ? onPreview(doc)
                      : onNavigate && onNavigate('document-details', { documentId: doc.id })
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Open</span>
                </button>
                <button
                  onClick={() => onDownload(doc)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

