import React from 'react';
import {
  Files,
  History,
  Radar,
  ShieldAlert,
  Cpu,
  UploadCloud,
  KeyRound,
  Search,
  Bell,
  Activity,
  User as UserIcon,
  Shield,
} from './icons';
import { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  userRole: UserRole;
  documentsCount: number;
  refusedCount: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  userRole,
  documentsCount,
  refusedCount,
  unreadNotificationsCount = 0,
}) => {
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      icon: Activity,
    },
    {
      id: 'documents',
      label: 'All Documents',
      icon: Files,
      badge: documentsCount > 0 ? documentsCount : undefined,
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    },
    {
      id: 'upload',
      label: 'Upload Document',
      icon: UploadCloud,
      ownerOrAdminOnly: true,
    },
    {
      id: 'permissions',
      label: 'Manage Permissions',
      icon: KeyRound,
      ownerOrAdminOnly: true,
    },
    {
      id: 'search',
      label: 'Advanced Search',
      icon: Search,
    },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      badgeColor: 'bg-pink-500 text-white shadow-xs shadow-pink-500/30',
    },
  ];

  const complianceNavItems = [
    {
      id: 'audit',
      label: 'Activity Ledger',
      icon: History,
      badge: 'SHA-256',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'security',
      label: 'Security Radar',
      icon: Radar,
      badge: refusedCount > 0 ? `${refusedCount} Blocked` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      adminOnly: true,
    },
    {
      id: 'threats',
      label: 'Threats & Defenses',
      icon: ShieldAlert,
      badge: 'STRIDE',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    },
    {
      id: 'profile',
      label: 'Account Profile',
      icon: UserIcon,
    },
  ];

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <aside className="w-64 border-r border-sky-100/90 dark:border-slate-800 bg-gradient-to-b from-sky-50/70 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between p-4 hidden md:flex shrink-0 transition-colors shadow-2xs">
      <div className="space-y-5">
        
        {/* Top Active Vault Indicator */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-50/90 via-white to-pink-50/60 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800 border border-sky-200/70 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Vault Active
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-white/95 dark:bg-slate-900 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-slate-700 uppercase tracking-wider">
              {userRole}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Strict Zero-Trust Access Mode
          </p>
        </div>

        {/* Primary Workspace Navigation */}
        <div>
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-sky-800/70 dark:text-sky-400/80 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map(item => {
              if (item.ownerOrAdminOnly && !isOwnerOrAdmin) return null;

              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-pink-500 text-white shadow-md shadow-sky-500/20 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
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

        {/* Security & Verification Section */}
        <div>
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-sky-800/70 dark:text-sky-400/80 mb-2">
            Security & Controls
          </div>
          <nav className="space-y-1">
            {complianceNavItems.map(item => {
              if (item.adminOnly && userRole !== 'admin') return null;

              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-pink-500 text-white shadow-md shadow-sky-500/20 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
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
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-sky-100/90 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Shield className="h-3.5 w-3.5 text-sky-500" />
          <span>TrustVault</span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-slate-700">
          <Cpu className="h-3 w-3 text-sky-600 dark:text-sky-400" />
          <span>v1.0</span>
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
