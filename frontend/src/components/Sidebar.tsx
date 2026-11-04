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
      label: 'My Documents',
      icon: Files,
      badge: documentsCount > 0 ? documentsCount : undefined,
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'audit' as const,
      label: 'Activity History',
      icon: History,
      badge: 'Tamper-Proof',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'security' as const,
      label: 'Security Overview',
      icon: Radar,
      badge: refusedCount > 0 ? `${refusedCount} Alerts` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
      adminOnly: true,
    },
    {
      id: 'threats' as const,
      label: 'Security & Protections',
      icon: ShieldAlert,
      badge: 'Explainer',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white/75 backdrop-blur-md flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Main Menu
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
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

        {/* Protection Pillars Summary Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50/70 via-white to-pink-50/50 p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>How TrustVault Protects You</span>
          </div>
          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
            <li className="flex items-start gap-1.5">
              <span className="text-sky-600 font-bold">•</span>
              <span><strong className="text-slate-900 font-semibold">Server-Checked Access:</strong> The server checks permission every time. Hidden buttons aren't enough.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-pink-600 font-bold">•</span>
              <span><strong className="text-slate-900 font-semibold">Instant Lockout:</strong> Taking access back stops working immediately in 0 seconds.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong className="text-slate-900 font-semibold">Permanent History:</strong> Every view and download is locked in a tamper-proof record.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong className="text-slate-900 font-semibold">Human in Control:</strong> AI only suggests. A human always approves.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex items-center justify-between font-medium">
        <span>Protected Storage</span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600 font-semibold">
          <Cpu className="h-3 w-3 text-sky-600" /> TrustVault v1.0
        </span>
      </div>
    </aside>
  );
};
