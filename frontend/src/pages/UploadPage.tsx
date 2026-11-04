import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  X,
  FileText,
} from '../components/icons';
import { DocumentClassification } from '../types';

interface UploadPageProps {
  onUpload: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUpload, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Finance');
  const [classification, setClassification] = useState<DocumentClassification>('CONFIDENTIAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category.trim());
      formData.append('classification', classification);

      await onUpload(formData);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-sky-600" />
            Upload and Encrypt Document
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Files are validated via binary inspection and encrypted with AES-256-GCM before storage.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
        
        {/* Dropzone */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Select Document File</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.csv,.txt"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
                <FileCheck className="h-6 w-6 text-emerald-600" />
                <span className="font-bold text-sm">{file.name}</span>
                <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-sky-600 mx-auto transition" />
                <div className="text-slate-800 font-bold text-sm">Click to choose a file or drag and drop</div>
                <div className="text-slate-400 text-[11px]">
                  PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Images (.png, .jpg), Text (.txt, .csv) — Max 25MB
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Document Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Q4 Financial Audit & Executive Summary"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Category & Sensitivity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Department / Category</label>
            <input
              type="text"
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Finance, Legal, HR, Operations..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Sensitivity Classification</label>
            <select
              value={classification}
              onChange={e => setClassification(e.target.value as DocumentClassification)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
            >
              <option value="INTERNAL">Internal (Company wide access)</option>
              <option value="CONFIDENTIAL">Confidential (Explicit named grants)</option>
              <option value="RESTRICTED">Restricted (Highest isolation)</option>
              <option value="PUBLIC">Public (Unrestricted)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Context & Description (Optional)</label>
          <textarea
            rows={3}
            placeholder="Context regarding compliance regulations or intended audience..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Verification Guarantee Callout */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-slate-700 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Evidentiary Cryptographic Guarantee</span>
          </div>
          <p className="leading-relaxed">
            The backend inspects magic bytes (%PDF, PK\x03\x04, PNG headers) to prevent MIME spoofing, generates a SHA-256 payload checksum, and immediately writes an upload event into the append-only cryptographic ledger.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold transition shadow-md shadow-sky-500/25 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Encrypting & Storing...</span>
              </>
            ) : (
              <>
                <span>Upload & Secure Document</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

