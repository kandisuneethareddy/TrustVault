import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, ShieldCheck, ArrowRight } from './icons';
import { AiAdvisory, DocumentItem } from '../types';
import { api } from '../services/api';

interface AiAdvisoryModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AiAdvisoryModal: React.FC<AiAdvisoryModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [advisory, setAdvisory] = useState<AiAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      setAdvisory(null);
      setError(null);
      setStatusMessage(null);
      runAnalysis();
    }
  }, [isOpen, document]);

  const runAnalysis = async () => {
    if (!document) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.analyzeDocumentPolicy(document.id);
      setAdvisory(res);
    } catch (err: any) {
      setError(err.message || 'AI policy analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'CONFIRM' | 'REJECT') => {
    if (!advisory) return;
    try {
      setIsSubmitting(true);
      setError(null);

      const approvedGrants =
        decision === 'CONFIRM'
          ? advisory.suggestedGrants.map(g => ({
              userId: g.userId,
              accessLevel: g.suggestedLevel,
            }))
          : [];

      await api.reviewAiAdvisory({
        advisoryId: advisory.advisoryId,
        decision,
        approvedGrants,
        updatedClassification: decision === 'CONFIRM' ? advisory.suggestedClassification : undefined,
      });

      setStatusMessage(
        decision === 'CONFIRM'
          ? `✅ Human Owner Confirmed: Applied ${approvedGrants.length} suggested grants and updated classification. Both AI suggestion and your decision are logged in the audit ledger.`
          : '🚫 Human Owner Rejected: AI suggestion dismissed. Zero database permissions modified.'
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Policy & Access Advisory</h2>
              <p className="text-[11px] text-slate-400">
                Document Risk Classification & Suggested Access Boundaries
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

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Strict Zero-Trust Safety Callout */}
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 text-[11px] space-y-1 text-amber-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Zero-Trust Human-in-the-Loop Constraint (Mandatory)
          </div>
          <p className="text-amber-200/80 leading-relaxed">
            The AI model assists in risk evaluation and suggests candidate recipients. <strong>The machine never widens access on its own.</strong> A human document owner must explicitly confirm the decision, and both the AI suggestion and human action are cryptographically logged into the evidentiary audit ledger.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
            <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs">Analyzing semantic metadata, PII vectors, and department boundaries...</div>
          </div>
        ) : advisory ? (
          <div className="space-y-4 text-xs">
            {/* Risk Indicators & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  Recommended Policy
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-xs">
                    {advisory.suggestedClassification}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Confidence: {(advisory.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  Current classification is <strong className="text-slate-200">{document.classification}</strong>.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  Detected Risk Vectors
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {advisory.riskIndicators.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-slate-400">AI Advisory Rationale:</strong> {advisory.reasoning}
            </div>

            {/* Suggested Grants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Suggested Recipient Grants ({advisory.suggestedGrants.length})</span>
                <span className="text-[10px] text-slate-500">Requires Your Confirmation</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0B0F17] overflow-hidden">
                {advisory.suggestedGrants.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No recipients suggested. Highly compartmentalized document.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                    {advisory.suggestedGrants.map(grant => (
                      <div key={grant.userId} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40">
                        <div>
                          <div className="font-semibold text-slate-200">{grant.userName}</div>
                          <div className="text-[10px] text-slate-400">{grant.userEmail}</div>
                          <div className="text-[10px] text-blue-400 mt-0.5">{grant.reason}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {grant.suggestedLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Decision Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDecision('REJECT')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-400 font-medium transition"
              >
                Reject Suggestion
              </button>

              <button
                type="button"
                onClick={() => handleDecision('CONFIRM')}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                {isSubmitting ? (
                  <span>Applying Human Decision...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm & Apply Grants</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
};
