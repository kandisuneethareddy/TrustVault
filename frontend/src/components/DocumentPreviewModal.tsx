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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{document.title}</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {document.fileName} · {(document.fileSize / 1024).toFixed(1)} KB · {document.classification}
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

        {/* Cryptographic Proof Banner */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Cryptographic Integrity Attestation
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
              <Key className="h-3 w-3 text-blue-400" /> AES-256-GCM
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 break-all">
            <span className="text-slate-500 shrink-0">SHA-256 Checksum:</span>
            <span className="text-blue-300 font-semibold">{document.checksumSha256}</span>
          </div>
        </div>

        {/* Content Viewer Sandbox */}
        <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 min-h-[220px] max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs">Zero-Trust Authorization Decider executing...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-red-400 space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="font-bold text-xs">{error}</div>
              <div className="text-[10px] text-slate-500 max-w-sm">
                This refused access attempt has been permanently recorded in the immutable audit ledger with your user identity and IP address.
              </div>
            </div>
          ) : imageUrl ? (
            <div className="flex justify-center">
              <img src={imageUrl} alt="Document preview" className="max-h-[300px] object-contain rounded-lg" />
            </div>
          ) : (
            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
              {content}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Audited access event recorded on server</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(document)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/30"
            >
              <Download className="h-4 w-4" />
              <span>Download Decrypted Copy</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
