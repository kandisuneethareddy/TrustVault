import React from 'react';
import { Shield, ShieldAlert, KeyRound, LogOut, ChevronDown, CheckCircle2, User as UserIcon } from './icons';
import { User } from '../types';

interface TopNavProps {
  currentUser: User | null;
  onSwitchPersona: (email: string) => void;
  onLogout: () => void;
  onOpenRevokeSessions: () => void;
  ledgerVerified: boolean;
  totalRefused: number;
}

const DEMO_PERSONAS = [
  {
    email: 'admin@trustvault.corp',
    name: 'Arthur Vance',
    role: 'admin',
    department: 'Global Compliance',
    badge: 'Compliance Admin',
    desc: 'Audits access, inspects cryptographic proofs & telemetry',
    color: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
  },
  {
    email: 'alice@trustvault.corp',
    name: 'Alice Chen',
    role: 'owner',
    department: 'Finance & HR',
    badge: 'Document Owner',
    desc: 'Controls salary & contractual docs, grants & revokes access',
    color: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  },
  {
    email: 'bob@trustvault.corp',
    name: 'Bob Martinez',
    role: 'owner',
    department: 'Engineering & R&D',
    badge: 'Document Owner',
    desc: 'Owns Project Titan specs, isolated from Alice documents',
    color: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
  },
  {
    email: 'charlie@trustvault.corp',
    name: 'Charlie Davis',
    role: 'viewer',
    department: 'Legal Counsel',
    badge: 'Authorized Viewer',
    desc: 'Granted READ to salary matrix; cannot edit or delete',
    color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
  },
  {
    email: 'eve@untrusted.org',
    name: 'Eve Adams',
    role: 'viewer',
    department: 'External Untrusted',
    badge: 'Unauthorized Entity',
    desc: 'Zero document grants; tests perimeter breach defenses',
    color: 'border-red-500/50 text-red-400 bg-red-500/10',
  },
];

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  onSwitchPersona,
  onLogout,
  onOpenRevokeSessions,
  ledgerVerified,
  totalRefused,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                TrustVault
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                RISE Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Zero-Trust Document Sharing & Evidentiary Audit Trail
            </p>
          </div>
        </div>

        {/* Security Status Bar */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Zero-Trust Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">
              Ledger: {ledgerVerified ? '100% Cryptographically Verified' : 'Integrity Alert'}
            </span>
          </div>

          {totalRefused > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-800/60 text-red-400 font-medium">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{totalRefused} Breach Probes Repelled</span>
            </div>
          )}
        </div>

        {/* Persona Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Persona Switcher for Hackathon Judges */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition"
              title="Click to switch persona immediately for testing"
            >
              <KeyRound className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Role Preset:</span>
              <span className="font-semibold text-white">{currentUser?.name.split(' ')[0]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Judge Evaluation Switcher
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Switch identities to test permissions & boundary enforcement
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
                      className={`w-full text-left p-2 rounded-lg text-xs transition flex flex-col gap-0.5 ${
                        currentUser?.email === p.email
                          ? 'bg-blue-600/20 border border-blue-500/40'
                          : 'hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">{p.name}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border ${p.color}`}>
                          {p.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{p.department}</span>
                      <span className="text-[10px] text-slate-500 leading-tight">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current User Badge */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400">{currentUser.department}</div>
              </div>
            </div>
          )}

          {/* Session Invalidate & Logout */}
          <button
            onClick={onOpenRevokeSessions}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
            title="Invalidate all active sessions across devices"
          >
            <KeyRound className="h-4 w-4" />
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
