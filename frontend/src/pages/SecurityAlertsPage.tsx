import React from 'react';
import { Radar, ChevronRight } from '../components/icons';
import { SecurityRadarView } from '../components/SecurityRadarView';

interface SecurityAlertsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const SecurityAlertsPage: React.FC<SecurityAlertsPageProps> = ({ onNavigate }) => {
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
          <span className="text-slate-800 font-semibold">Security Alerts</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Radar className="h-6 w-6 text-sky-600" />
          <span>Security Radar & Attack Telemetry</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Real-time monitoring of blocked access attempts, system health, and emergency global session controls.
        </p>
      </div>

      {/* Main Security Radar Component */}
      <SecurityRadarView />
    </div>
  );
};

