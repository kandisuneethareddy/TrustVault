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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-50 to-sky-50 text-pink-700 border border-pink-200 shadow-2xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Smart Sharing Assistant</h2>
              <p className="text-[11px] text-slate-500">
                AI recommendations for sensitivity and who should have access
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

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Clear Human-in-the-Loop Reassurance Note */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] space-y-1 text-amber-900">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            Human in Control: AI Suggests, You Decide
          </div>
          <p className="text-amber-800 leading-relaxed">
            The AI model only provides suggestions. <strong>It can never give anyone access on its own.</strong> You have complete control to approve or dismiss these suggestions. Every suggestion and approval is recorded in the activity log.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs">Analyzing document details and matching colleagues...</div>
          </div>
        ) : advisory ? (
          <div className="space-y-4 text-xs">
            {/* Risk Indicators & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  Suggested Sensitivity Level
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                    {advisory.suggestedClassification}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Confidence: {(advisory.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  Currently set to <strong className="text-slate-900">{document.classification}</strong>.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  Important Points Noticed
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {advisory.riskIndicators.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-sky-600 font-bold">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
              <strong className="text-slate-900">Why this was suggested:</strong> {advisory.reasoning}
            </div>

            {/* Suggested Grants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Suggested Colleagues to Share With ({advisory.suggestedGrants.length})</span>
                <span className="text-[10px] text-slate-500">Requires Your Approval</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                {advisory.suggestedGrants.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No colleagues suggested. This document is kept private to you.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {advisory.suggestedGrants.map(grant => (
                      <div key={grant.userId} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60">
                        <div>
                          <div className="font-semibold text-slate-900">{grant.userName}</div>
                          <div className="text-[10px] text-slate-500">{grant.userEmail}</div>
                          <div className="text-[10px] text-sky-700 mt-0.5">{grant.reason}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {grant.suggestedLevel === 'EDIT' ? 'Can View & Edit' : 'View Only'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Decision Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDecision('REJECT')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold transition cursor-pointer"
              >
                Dismiss Suggestions
              </button>

              <button
                type="button"
                onClick={() => handleDecision('CONFIRM')}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold transition flex items-center gap-2 shadow-md shadow-sky-500/25 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving Your Decision...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Approve & Share With Selected Colleagues</span>
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
