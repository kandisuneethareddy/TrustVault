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
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
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
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  const complianceNavItems = [
    {
      id: 'audit',
      label: 'Activity Ledger',
      icon: History,
      badge: 'SHA-256',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      id: 'security',
      label: 'Security Radar',
      icon: Radar,
      badge: refusedCount > 0 ? `${refusedCount} Blocked` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      adminOnly: true,
    },
    {
      id: 'threats',
      label: 'Threats & Defenses',
      icon: ShieldAlert,
      badge: 'STRIDE',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    },
    {
      id: 'profile',
      label: 'Account Profile',
      icon: UserIcon,
    },
  ];

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 hidden md:flex shrink-0 transition-colors">
      <div className="space-y-6">
        {/* Workspace Management */}
        <div>
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
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
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
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
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
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
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
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

      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
        <span>TrustVault Protected</span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
          <Cpu className="h-3 w-3 text-sky-600" /> v1.0
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
