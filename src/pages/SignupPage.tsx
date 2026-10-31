import React, { useState } from 'react';
import { AuthShell } from '../components/common/AuthShell';
import { useApp } from '../context/AppContext';
import { WorkspaceChoice } from '../components/common/WorkspaceChoice';
import type { Workspace } from '../types/commercial';

export const SignupPage: React.FC = () => {
  const { signUp, navigateTo, currentPath } = useApp();
  const [workspace, setWorkspace] = useState<Workspace>(currentPath.endsWith('/msme') ? 'commercial' : 'household');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(name, email, password, workspace);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Unable to create your account.');
      return;
    }
    // Redirect to onboarding after successful signup
    navigateTo(workspace === 'commercial' ? '/commercial' : '/onboarding');
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title={workspace === 'commercial' ? 'Bring solar to your business.' : 'Create your Solaris account'}
      subtitle={workspace === 'commercial' ? 'Create your organisation, set up a property, and compare solar options.' : 'Save your solar plan and join a community cohort.'}
      footer={
        <span>
          Already have an account?{' '}
          <button
            onClick={() => navigateTo(workspace === 'commercial' ? '/login/msme' : '/login/household')}
            className="font-bold text-[#006b57] hover:underline"
          >
            Log in
          </button>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <WorkspaceChoice value={workspace} onChange={value => navigateTo(value === 'commercial' ? '/signup/msme' : '/signup/household')} />
        {error && (
          <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="signup-name" className="text-xs font-semibold text-[#101d24] block mb-1">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            className="w-full h-11 px-3 rounded-lg border border-[#c0c8c5] bg-white text-sm text-[#101d24] placeholder:text-[#9aa5a1] focus:outline-none focus:border-[#006b57] focus:ring-2 focus:ring-[#9af4d8]/40"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="text-xs font-semibold text-[#101d24] block mb-1">
            Email address
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="text-xs font-semibold text-[#101d24] block mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
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

        <div>
          <label htmlFor="signup-confirm-password" className="text-xs font-semibold text-[#101d24] block mb-1">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            className="w-full h-11 px-3 rounded-lg border border-[#c0c8c5] bg-white text-sm text-[#101d24] placeholder:text-[#9aa5a1] focus:outline-none focus:border-[#006b57] focus:ring-2 focus:ring-[#9af4d8]/40"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-[#006b57] text-white text-sm font-bold hover:bg-[#002620] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
};
