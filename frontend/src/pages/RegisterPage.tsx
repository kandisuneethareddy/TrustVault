import React, { useState } from 'react';
import { Shield, Lock, Eye, AlertTriangle, ArrowRight, CheckCircle2 } from '../components/icons';
import { api } from '../services/api';
import { User } from '../types';

interface RegisterPageProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Legal Counsel');
  const [role, setRole] = useState<'owner' | 'viewer'>('viewer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        department: department.trim(),
        role, // Cannot be 'admin'!
      });
      onRegisterSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/20 to-pink-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Top Brand Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2.5 p-2 rounded-2xl hover:bg-white/80 transition cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">TrustVault</span>
        </button>
        <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
          Create an Enterprise Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Join your organization's zero-trust document network.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 space-y-6">

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rachel Foster"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rachel@trustvault.corp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Finance, Legal, HR..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'owner' | 'viewer')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="owner">Document Owner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-800">
              <span className="font-bold">Security Notice:</span> For safety compliance, Administrator accounts cannot be self-selected during public sign-up and are assigned exclusively by system compliance officers.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onNavigateLogin}
              className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer underline"
            >
              Log in here
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

