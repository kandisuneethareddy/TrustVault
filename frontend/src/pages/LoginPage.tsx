import React, { useState } from 'react';
import { Shield, Lock, Eye, AlertTriangle, ArrowRight, Sun, Moon } from '../components/icons';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister?: () => void;
  onNavigateHome?: () => void;
  onNavigate?: (page: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateHome,
  onNavigate,
  theme = 'light',
  onToggleTheme,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoToRegister = () => {
    if (onNavigate) {
      onNavigate('register');
    } else if (onNavigateRegister) {
      onNavigateRegister();
    }
  };

  const handleGoToHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide both your registered work email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/50 via-white to-pink-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors relative">
      
      {/* Dark / Light Toggle */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      )}

      {/* Top Brand Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={handleGoToHome}
          className="inline-flex items-center gap-2.5 p-2 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">TrustVault</span>
        </button>
        <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Sign In to Your Vault
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter your authorized personal credentials to access your protected documents.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.corp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Please contact compliance administrator to reset your vault credentials.')}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 cursor-pointer font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            Don't have an account yet?{' '}
            <button
              onClick={handleGoToRegister}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 font-semibold cursor-pointer underline"
            >
              Register here
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
