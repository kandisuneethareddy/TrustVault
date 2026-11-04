import React from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  History,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
} from '../components/icons';
import { User } from '../types';

interface HomePageProps {
  currentUser?: User | null;
  onNavigate: (page: string, params?: any) => void;
  onSwitchPersona?: (email: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  onNavigate,
  theme = 'light',
  onToggleTheme,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-sky-100 selection:text-sky-900">
      {/* 1. Clean Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-pink-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              TrustVault
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle (Dark / Light) */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {currentUser ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Go to My Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Direct, Simple Hero */}
      <section className="pt-16 pb-20 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Zero-Trust Confidential Document Management</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Your Documents. Your Control.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-pink-500">
            Your Trust.
          </span>
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Securely manage, share, and monitor confidential documents with individual document-level access control, instant revocation, and an immutable cryptographic audit ledger.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center gap-2"
          >
            <span>Sign In to Vault</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            Create New Account
          </button>
        </div>
      </section>

      {/* 3. Essential 3 Security Pillars */}
      <section className="py-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Document-Level Permissions
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Grant READ or EDIT access only to specific colleagues by email. Each document is individually governed and verified by the server on every request.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Real-Time Access Revocation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Revoke access immediately in 0 milliseconds. All future preview and download requests are denied on the spot by backend validation.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Cryptographic Audit Ledger
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every file open, preview, download, and denied access attempt is recorded in a tamper-evident SHA-256 hash-chained audit log.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 text-center">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>TrustVault Secure Document Platform</span>
          <span>Zero-Trust Architecture · Cryptographically Verified</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
