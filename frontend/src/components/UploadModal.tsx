import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileCheck, AlertTriangle, ShieldCheck } from './icons';
import { DocumentClassification } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Contracts');
  const [classification, setClassification] = useState<DocumentClassification>('CONFIDENTIAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      setError('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-50 to-pink-50 text-sky-700 border border-sky-200 shadow-2xs">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload & Protect Document</h2>
              <p className="text-[11px] text-slate-500">Your file is encrypted right away. Only people you invite can open it.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* File Dropzone */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Select Document</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-sky-50/40 transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv,.txt,.json"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-sky-600 mx-auto transition" />
                  <div className="text-slate-700 font-medium">Click to choose a file or drag it here</div>
                  <div className="text-[10px] text-slate-500">PDF, Word (.docx), Excel (.xlsx), Images (.png, .jpg), Text (.txt, .csv)</div>
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
              placeholder="e.g. Employee Compensation Plan 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief note about this document for colleagues..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category & Classification */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department</label>
              <input
                type="text"
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Finance, Legal, HR, Operations"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sensitivity Level</label>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value as DocumentClassification)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="INTERNAL">Internal (Company wide)</option>
                <option value="CONFIDENTIAL">Confidential (Named recipients)</option>
                <option value="RESTRICTED">Restricted (Highest sensitivity)</option>
                <option value="PUBLIC">Public (General)</option>
              </select>
            </div>
          </div>

          {/* Automatic safety check callout */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Automatic Safety Verification:</span> Scans real file contents to make sure it is a genuine document and not disguised malware. Every upload is logged into the permanent activity record.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold transition flex items-center gap-2 shadow-md shadow-sky-500/25 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting & Storing...</span>
                </>
              ) : (
                <span>Upload & Protect</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
