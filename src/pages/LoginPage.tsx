import React, { useState } from 'react';
import { AuthShell } from '../components/common/AuthShell';
import { useApp } from '../context/AppContext';
import { WorkspaceChoice } from '../components/common/WorkspaceChoice';
import type { Workspace } from '../types/commercial';

export const LoginPage: React.FC = () => {
  const { logIn, demoLogin, navigateTo, currentPath } = useApp();
  const [workspace, setWorkspace] = useState<Workspace>(currentPath.endsWith('/msme') ? 'commercial' : 'household');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await logIn(email, password, workspace);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Unable to log in.');
      return;
    }
    navigateTo(workspace === 'commercial' ? '/commercial' : '/dashboard');
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={workspace === 'commercial' ? 'Your business. Powered by solar.' : 'Welcome home to Solaris.'}
      subtitle={workspace === 'commercial' ? 'Manage your mall, compare solar investments, and plan tenant benefits.' : 'Your home, community solar plan, and savings in one place.'}
      footer={
        <span>
          New to Solaris?{' '}
          <button
            onClick={() => navigateTo(workspace === 'commercial' ? '/signup/msme' : '/signup/household')}
            className="font-bold text-[#006b57] hover:underline"
          >
            Create an account
          </button>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <WorkspaceChoice value={workspace} onChange={value => navigateTo(value === 'commercial' ? '/login/msme' : '/login/household')} />
        {error && (
          <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="text-xs font-semibold text-[#101d24] block mb-1">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full h-11 px-3 rounded-lg border border-[#c0c8c5] bg-white text-sm text-[#101d24] placeholder:text-[#9aa5a1] focus:outline-none focus:border-[#006b57] focus:ring-2 focus:ring-[#9af4d8]/40"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="text-xs font-semibold text-[#101d24] block mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full h-11 pl-3 pr-10 rounded-lg border border-[#c0c8c5] bg-white text-sm text-[#101d24] placeholder:text-[#9aa5a1] focus:outline-none focus:border-[#006b57] focus:ring-2 focus:ring-[#9af4d8]/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-[#717976] hover:bg-[#e2f0f9] focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-[#006b57] text-white text-sm font-bold hover:bg-[#002620] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
        >
          {isSubmitting ? 'Logging in...' : workspace === 'commercial' ? 'Log in to MSME & Malls' : 'Log in to Households'}
        </button>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[#738078]"><span className="h-px flex-1 bg-[#dce5df]" />Explore first<span className="h-px flex-1 bg-[#dce5df]" /></div>
        <button type="button" disabled={isSubmitting} className="w-full rounded-lg border border-[#006b57] px-3 py-3 text-sm font-bold text-[#006b57] disabled:opacity-50"
          onClick={async () => {
            setError(''); setIsSubmitting(true);
            const result = await demoLogin(workspace); setIsSubmitting(false);
            if (!result.success) setError(result.error!);
            else navigateTo(workspace === 'commercial' ? '/commercial' : '/dashboard');
          }}>Explore {workspace === 'commercial' ? 'mall' : 'household'} demo →</button>
        <p className="text-[11px] leading-relaxed text-[#738078]">Demo opens a separate workspace with synthetic data. No real provider enquiries are sent.</p>
        {workspace === 'commercial' && <button type="button" disabled={isSubmitting} className="w-full text-xs font-semibold text-[#006b57] py-2" onClick={async () => {
          setIsSubmitting(true); setError('');
          const result = await demoLogin('commercial', 'tenant'); setIsSubmitting(false);
          if (result.success) navigateTo('/commercial'); else setError(result.error!);
        }}>Explore restricted tenant demo →</button>}
      </form>
    </AuthShell>
  );
};
