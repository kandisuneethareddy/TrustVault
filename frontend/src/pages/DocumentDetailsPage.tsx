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
  User as UserIcon,
  Lock,
} from '../components/icons';
import { DocumentItem, User } from '../types';
import { api } from '../services/api';

interface DocumentDetailsPageProps {
  documentId?: string;
  document?: DocumentItem | null;
  documents?: DocumentItem[];
  currentUser: User | null;
  onNavigate?: (page: string, params?: any) => void;
  onBack?: () => void;
  onDownload: (doc: DocumentItem) => void;
  onManagePermissions?: (doc: DocumentItem) => void;
  onOpenAiAdvisory?: (doc: DocumentItem) => void;
  onDelete?: (doc: DocumentItem) => void;
}

export const DocumentDetailsPage: React.FC<DocumentDetailsPageProps> = ({
  documentId,
  document: propDoc,
  documents = [],
  currentUser,
  onNavigate,
  onBack,
  onDownload,
  onManagePermissions,
  onOpenAiAdvisory,
  onDelete,
}) => {
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(
    propDoc || documents.find(d => d.id === documentId) || null
  );
  const [content, setContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate('documents');
  };

  useEffect(() => {
    let isMounted = true;

    const targetDoc = propDoc || documents.find(d => d.id === documentId);
    if (targetDoc) {
      setActiveDoc(targetDoc);
    }

    const docId = targetDoc?.id || documentId;
    if (!docId) return;

    setIsLoading(true);
    setError(null);

    api
      .previewDocument(docId)
      .then(res => {
        if (!isMounted) return;
        if (res.text) {
          setContent(res.text);
        } else if (res.blob && res.mimeType.startsWith('image/')) {
          const url = URL.createObjectURL(res.blob);
          setImageUrl(url);
        } else {
          setContent(`[Encrypted binary document payload. Click 'Download Document' below to decrypt and view the original file.]`);
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
  }, [documentId, propDoc, documents]);

  if (!activeDoc && !documentId) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">No Document Selected</h2>
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold text-xs cursor-pointer"
        >
          Return to Documents
        </button>
      </div>
    );
  }

  const doc = activeDoc || {
    id: documentId || '',
    title: 'Loading Document...',
    description: '',
    fileName: 'document.bin',
    fileSize: 0,
    category: 'General',
    classification: 'CONFIDENTIAL',
    ownerName: 'Vault Owner',
    ownerEmail: '',
    createdAt: new Date().toISOString(),
    isOwner: false,
    accessLevel: 'READ',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header / Breadcrumb navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="text-xs font-semibold text-slate-500 hover:text-sky-600 transition cursor-pointer"
          >
            Documents
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900">{doc.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(doc as DocumentItem)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download Document</span>
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <FileText className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-black text-slate-900">{doc.title}</h1>
            </div>
            <p className="text-xs text-slate-500 pt-1 leading-relaxed">{doc.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
              {doc.classification}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {doc.category}
            </span>
          </div>
        </div>

        {/* Technical Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <div className="text-[10px] font-semibold text-slate-400">File Name</div>
            <div className="font-mono text-slate-700 truncate">{doc.fileName}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400">Payload Size</div>
            <div className="text-slate-700">{((doc.fileSize || 0) / 1024).toFixed(1)} KB</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400">Encryption Method</div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>AES-256-GCM</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400">Custody Owner</div>
            <div className="text-slate-700 font-medium truncate">{doc.ownerName}</div>
          </div>
        </div>
      </div>

      {/* In-Browser Decrypted Preview Sandbox */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Lock className="h-4 w-4 text-sky-600" />
            <span>Decrypted Document Preview</span>
          </div>
          <span className="text-[10px] text-slate-400">Server verified · Streamed over TLS</span>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="inline-block animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full"></div>
              <div className="text-xs font-medium">Validating real-time permissions & decrypting payload...</div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <div className="font-bold">Access Blocked by Server</div>
                <div className="text-[11px] text-rose-700/90">{error}</div>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="flex justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <img src={imageUrl} alt={doc.title} className="max-h-96 rounded-xl object-contain shadow-xs" />
            </div>
          ) : (
            <pre className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
export default DocumentDetailsPage;
