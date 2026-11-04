import React from 'react';
import { History, ChevronRight } from '../components/icons';
import { AuditLedgerView } from '../components/AuditLedgerView';

interface AuditPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AuditPage: React.FC<AuditPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hover:text-sky-600 transition cursor-pointer"
          >
            Dashboard
          </button>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-800 font-semibold">Activity Ledger</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <History className="h-6 w-6 text-sky-600" />
          <span>Tamper-Evident Audit Ledger</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Every upload, download, permission grant, instant revocation, and refused breach attempt is cryptographically chained using SHA-256 blocks.
        </p>
      </div>

      {/* Main Audit Ledger Component */}
      <AuditLedgerView />
    </div>
  );
};

