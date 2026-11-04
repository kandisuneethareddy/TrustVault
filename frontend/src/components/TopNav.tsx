import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  KeyRound,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Bell,
  Search,
  Sun,
  Moon,
  User as UserIcon,
} from './icons';
import { User } from '../types';

interface TopNavProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenRevokeSessions: () => void;
  onNavigate?: (page: string, params?: any) => void;
  unreadNotifications?: number;
  ledgerVerified: boolean;
  totalRefused: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSwitchPersona?: (email: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  onLogout,
  onOpenRevokeSessions,
  onNavigate,
  unreadNotifications = 0,
  ledgerVerified,
  totalRefused,
  theme = 'light',
  onToggleTheme,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'System Admin',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        };
      case 'owner':
        return {
          label: 'Document Owner',
          color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
        };
      default:
        return {
          label: 'Authorized Viewer',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-100/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate && onNavigate(currentUser ? 'dashboard' : 'login')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-pink-500 flex items-center justify-center shadow-md shadow-sky-500/20 text-white group-hover:scale-105 transition">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                TrustVault
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-full">
                Zero-Trust
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Confidential Document Management
            </p>
          </div>
        </div>

        {/* Protection Telemetry Status */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs"
            title="Real-time backend authorization active on every request"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Active Vault Defense</span>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('audit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
            title="Cryptographic SHA-256 tamper-evident activity ledger"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ledger: {ledgerVerified ? 'Verified' : 'Check'}</span>
          </div>

          {totalRefused > 0 && (
            <div
              onClick={() => onNavigate && onNavigate('security')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900 transition"
              title="Unauthorized access attempts stopped by security policies"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>{totalRefused} Blocked</span>
            </div>
          )}
        </div>

        {/* User Workspace Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle (Dark / Light) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-500 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>
          )}

          {/* Search Button */}
          {currentUser && onNavigate && (
            <button
              onClick={() => onNavigate('search')}
              className="p-2 text-slate-500 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Search My Accessible Documents"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Notifications Button */}
          {currentUser && onNavigate && (
            <button
              onClick={() => onNavigate('notifications')}
              className="relative p-2 text-slate-500 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="My Notifications & Shared Files"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>
          )}

          {/* Logged-In User Profile Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    {currentUser.email}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate && onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>My Account Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate && onNavigate('notifications');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>My Notifications</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-500 text-white rounded-full">
                          {unreadNotifications}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenRevokeSessions();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                      <span>Sign Out All Other Devices</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopNav;
