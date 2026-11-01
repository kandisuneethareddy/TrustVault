import React from 'react';
import { Files, ShieldCheck, History, Radar, ShieldAlert, Cpu } from './icons';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: 'documents' | 'audit' | 'security' | 'threats';
  onSelectTab: (tab: 'documents' | 'audit' | 'security' | 'threats') => void;
  userRole: UserRole;
  documentsCount: number;
  refusedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  documentsCount,
  refusedCount,
}) => {
  const navItems = [
    {
      id: 'documents' as const,
      label: 'Vault Documents',
      icon: Files,
      badge: documentsCount > 0 ? documentsCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-400',
    },
    {
      id: 'audit' as const,
      label: 'Cryptographic Ledger',
      icon: History,
      badge: 'SHA-256',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'security' as const,
      label: 'Security Command Center',
      icon: Radar,
      badge: refusedCount > 0 ? `${refusedCount} Alerts` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400',
      adminOnly: true,
    },
    {
      id: 'threats' as const,
      label: 'THREATS.md Model',
      icon: ShieldAlert,
      badge: 'STRIDE',
      badgeColor: 'bg-purple-500/20 text-purple-400',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B0F17] flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Vault Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              if (item.adminOnly && userRole !== 'admin') return null;

              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Zero-Trust Pillars Summary Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>RISE Architecture Rules</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4">
            <li><span className="text-slate-200 font-medium">Server Decides:</span> 100% server-evaluated.</li>
            <li><span className="text-slate-200 font-medium">Evidentiary Proof:</span> Chained SHA-256 blocks.</li>
            <li><span className="text-slate-200 font-medium">Instant Revocation:</span> Zero-staleness DB checks.</li>
            <li><span className="text-slate-200 font-medium">AI Human-in-Loop:</span> Autonomous grant disabled.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
        <span>AES-256-GCM Vault</span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
          <Cpu className="h-3 w-3 text-blue-400" /> v1.0.0
        </span>
      </div>
    </aside>
  );
};
