import React from 'react';
import {
  Shield,
  ShieldAlert,
  KeyRound,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Bell,
  Search,
  User as UserIcon,
} from './icons';
import { User } from '../types';

interface TopNavProps {
  currentUser: User | null;
  onSwitchPersona: (email: string) => void;
  onLogout: () => void;
  onOpenRevokeSessions: () => void;
  onNavigate?: (page: string, params?: any) => void;
  unreadNotifications?: number;
  ledgerVerified: boolean;
  totalRefused: number;
}

const DEMO_PERSONAS = [
  {
    email: 'admin@trustvault.corp',
    name: 'Arthur Vance',
    role: 'admin',
    department: 'Global Compliance',
    badge: 'System Admin',
    desc: 'Can see all activity logs, system health, and blocked access attempts',
    color: 'border-purple-200 text-purple-700 bg-purple-50',
  },
  {
    email: 'alice@trustvault.corp',
    name: 'Alice Chen',
    role: 'owner',
    department: 'Finance & HR',
    badge: 'Document Owner',
    desc: 'Owns salary and financial files. Can share them with others and take access back',
    color: 'border-sky-200 text-sky-700 bg-sky-50',
  },
  {
    email: 'bob@trustvault.corp',
    name: 'Bob Martinez',
    role: 'owner',
    department: 'Engineering & R&D',
    badge: 'Document Owner',
    desc: 'Owns engineering blueprints. Completely separate from Alice files',
    color: 'border-blue-200 text-blue-700 bg-blue-50',
  },
  {
    email: 'charlie@trustvault.corp',
    name: 'Charlie Davis',
    role: 'viewer',
    department: 'Legal Counsel',
    badge: 'Approved Viewer',
    desc: 'Given read-only access to specific files. Cannot edit, share, or delete',
    color: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  },
  {
    email: 'eve@untrusted.org',
    name: 'Eve Adams',
    role: 'viewer',
    department: 'External / Untrusted',
    badge: 'Unauthorized User',
    desc: 'Has no access grants. Perfect for testing that blocked users cannot see anything',
    color: 'border-rose-200 text-rose-700 bg-rose-50',
  },
];

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  onSwitchPersona,
  onLogout,
  onOpenRevokeSessions,
  onNavigate,
  unreadNotifications = 0,
  ledgerVerified,
  totalRefused,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate && onNavigate(currentUser ? 'dashboard' : 'home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white group-hover:scale-105 transition">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-sky-600 transition">
                TrustVault
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-sky-50 to-pink-50 text-sky-800 border border-sky-200 rounded-full">
                Zero-Trust
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Secure Document Sharing · Proof of Every Access
            </p>
          </div>
        </div>

        {/* Protection Status Bar */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-2xs"
            title="Server verifies permissions on every single view and download"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 font-semibold">Live Server Authorization</span>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('audit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium cursor-pointer hover:bg-emerald-100 transition"
            title="Activity history is cryptographically linked and cannot be edited"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ledger: {ledgerVerified ? '100% Verified' : 'Integrity Issue'}</span>
          </div>

          {totalRefused > 0 && (
            <div
              onClick={() => onNavigate && onNavigate('security')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold cursor-pointer hover:bg-rose-100 transition"
              title="Unauthorized attempts that were successfully stopped"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>{totalRefused} Probes Blocked</span>
            </div>
          )}
        </div>

        {/* Quick Nav Tools & Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Button */}
          {currentUser && onNavigate && (
            <button
              onClick={() => onNavigate('search')}
              className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
              title="Search Documents"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Notifications Button */}
          {currentUser && onNavigate && (
            <button
              onClick={() => onNavigate('notifications')}
              className="relative p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
              title="Notifications Center"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          )}

          {/* Quick Persona Switcher for Testing */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 via-white to-pink-50 hover:from-sky-100 hover:to-pink-100 border border-sky-200 text-xs font-semibold text-slate-800 shadow-2xs transition cursor-pointer"
              title="Click to switch between users and test different permissions"
            >
              <KeyRound className="h-3.5 w-3.5 text-sky-600" />
              <span className="text-slate-500 hidden sm:inline font-normal">Active User:</span>
              <span className="font-bold text-slate-900">
                {currentUser?.name.split(' ')[0] || 'Select'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                    <span>Switch Test Persona</span>
                    <span className="text-[10px] text-sky-600 font-semibold">1-Click Test</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Switch between roles to immediately test real-time permission barriers.
                  </div>
                </div>

                <div className="space-y-1">
                  {DEMO_PERSONAS.map(p => (
                    <button
                      key={p.email}
                      onClick={() => {
                        onSwitchPersona(p.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col gap-0.5 cursor-pointer ${
                        currentUser?.email === p.email
                          ? 'bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-300'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${p.color}`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-medium">
                        {p.department}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current User Avatar / Profile Link */}
          {currentUser && (
            <div
              onClick={() => onNavigate && onNavigate('profile')}
              className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
              title="View account profile"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-100 to-pink-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs group-hover:border-sky-400 transition">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500">{currentUser.department}</div>
              </div>
            </div>
          )}

          {/* Session Invalidate & Logout */}
          <button
            onClick={onOpenRevokeSessions}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
            title="Log out everywhere: Stops open sessions on all other devices immediately"
          >
            <KeyRound className="h-4 w-4" />
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Log out of this browser"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
