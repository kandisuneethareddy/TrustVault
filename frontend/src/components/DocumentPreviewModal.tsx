import React, { useEffect, useState } from 'react';
import { X, Download, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Key } from './icons';
import { DocumentItem } from '../types';
import { api } from '../services/api';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: DocumentItem) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !document) {
      setContent(null);
      setImageUrl(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api
      .previewDocument(document.id)
      .then(res => {
        if (!isMounted) return;
        if (res.text) {
          setContent(res.text);
        } else if (res.blob && res.mimeType.startsWith('image/')) {
          const url = URL.createObjectURL(res.blob);
          setImageUrl(url);
        } else {
          setContent('[Binary document payload: Click "Download Decrypted Copy" below to view locally]');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Decryption failed or access was denied by server.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-50 to-pink-50 text-sky-700 border border-sky-200 shadow-2xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{document.title}</h2>
              <p className="text-[11px] text-slate-500">
                {document.fileName} · {(document.fileSize / 1024).toFixed(1)} KB · {document.category}
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

        {/* Protection & Verification Banner */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Document Protection Verified
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">
              Encrypted at Rest
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            This reading view was authorized by the server and logged in the permanent activity record.
          </p>
        </div>

        {/* Content Viewer Sandbox */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 min-h-[220px] max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
              <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs">Checking permissions and opening file...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-rose-700 space-y-2">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
              <div className="font-bold text-xs">{error}</div>
              <div className="text-[11px] text-slate-500 max-w-sm">
                Access was refused by the server. This unapproved attempt has been recorded in the security audit history.
              </div>
            </div>
          ) : imageUrl ? (
            <div className="flex justify-center">
              <img src={imageUrl} alt="Document preview" className="max-h-[300px] object-contain rounded-lg border border-slate-200 shadow-2xs" />
            </div>
          ) : (
            <pre className="font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs">
              {content}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Server-verified access</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(document)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold transition shadow-md shadow-sky-500/25 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
