import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Download,
  KeyRound,
  Sparkles,
  Trash2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Lock,
} from '../components/icons';
import { DocumentItem, User as CurrentUserType } from '../types';
import { api } from '../services/api';

interface DocumentDetailsPageProps {
  document: DocumentItem;
  currentUser: CurrentUserType;
  onBack: () => void;
  onDownload: (doc: DocumentItem) => void;
  onManagePermissions: (doc: DocumentItem) => void;
  onOpenAiAdvisory: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export const DocumentDetailsPage: React.FC<DocumentDetailsPageProps> = ({
  document,
  currentUser,
  onBack,
  onDownload,
  onManagePermissions,
  onOpenAiAdvisory,
  onDelete,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          setContent(`[Encrypted binary document payload: "${document.fileName}". Click 'Download Document' below to decrypt and view the original file.]`);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Access denied or decryption failed');
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
  }, [document.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Header / Breadcrumb navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-sky-600 transition cursor-pointer"
          >
            ← Back to Documents
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(document)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Download Copy</span>
          </button>

          {document.isOwner && (
            <button
              onClick={() => onManagePermissions(document)}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="h-4 w-4" />
              <span>Share & Permissions</span>
            </button>
          )}

          {document.isOwner && (
            <button
              onClick={() => onOpenAiAdvisory(document)}
              className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Advice</span>
            </button>
          )}

          {(document.isOwner || currentUser.role === 'admin') && (
            <button
              onClick={() => onDelete(document)}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
              title="Delete Document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        
        {/* Title and Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-sky-50 to-pink-50 text-sky-700 border border-sky-200 shadow-2xs">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{document.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{document.description || 'No description provided.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
              {document.category}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
              {document.classification}
            </span>
          </div>
        </div>

        {/* Security & Cryptographic Proof Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Document Owner</div>
            <div className="font-bold text-slate-900 mt-0.5">{document.ownerName}</div>
            <div className="text-[10px] text-slate-500 font-mono">{document.ownerEmail}</div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Security Protection</div>
            <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>AES-256-GCM Encrypted</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Zero-Trust Evaluated</div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">SHA-256 Checksum</div>
            <div className="font-mono text-[10px] text-sky-700 font-semibold truncate mt-0.5" title={document.checksumSha256}>
              {document.checksumSha256.slice(0, 20)}...
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{(document.fileSize / 1024).toFixed(1)} KB</div>
          </div>
        </div>

        {/* Protected Document Reader Sandbox */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Authorized Document Reader</span>
            <span className="text-[10px] text-slate-400">Every view is cryptographically recorded in the audit trail</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 min-h-[260px] max-h-[460px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs">Decrypting ciphertext and verifying permissions...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-rose-700 space-y-2">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
                <div className="font-bold text-xs">{error}</div>
                <div className="text-[11px] text-slate-500 max-w-sm">
                  Access was denied by the server. This refusal has been recorded in the permanent audit ledger.
                </div>
              </div>
            ) : imageUrl ? (
              <div className="flex justify-center">
                <img src={imageUrl} alt="Decrypted preview" className="max-h-[380px] object-contain rounded-xl border border-slate-200 shadow-2xs" />
              </div>
            ) : (
              <pre className="font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                {content}
              </pre>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

