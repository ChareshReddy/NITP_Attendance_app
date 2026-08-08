'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  // Reset Password States
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // General Status States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear messages on view changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "DEACTIVATED" || res.error.includes("DEACTIVATED")) {
          throw new Error('Account is deactivated. Please contact HR/Admin.');
        }
        throw new Error('Invalid email or password');
      }

      // Fetch user session to determine role redirect
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role;
      
      if (role === 'HR_ADMIN') {
        router.push('/admin');
      } else if (role === 'TL') {
        router.push('/tl');
      } else if (role === 'EMPLOYEE') {
        router.push('/employee');
      } else {
        throw new Error('Unauthorized role');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setForgotSuccess(true);
      if (data.demoToken) {
        setDemoToken(data.demoToken);
        setResetToken(data.demoToken);
      }
      setSuccess('If the account exists, a reset token has been generated.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      setSuccess('Password reset successfully. Please log in.');
      setView('login');
      setPassword('');
      setDemoToken('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-brand-bg relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="Next IT Point Logo" 
            className="h-14 w-auto object-contain"
          />
        </div>
        
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-brand-navy font-heading">
          {view === 'login' && 'Sign in to your account'}
          {view === 'forgot' && 'Reset your password'}
          {view === 'reset' && 'Create new password'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 premium-card border border-gray-100">
          
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-brand-red flex items-start gap-2.5 border border-red-100 animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start gap-2.5 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div className="w-full">
                <p>{success}</p>
                {demoToken && (
                  <div className="mt-2 p-2 bg-white border border-emerald-200 rounded font-mono text-xs text-brand-navy select-all break-all">
                    Demo Token: {demoToken}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-semibold leading-6 text-brand-navy">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@nextitpoint.com"
                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-cta sm:text-sm sm:leading-6 bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold leading-6 text-brand-navy">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm font-medium text-brand-link hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-cta sm:text-sm sm:leading-6 bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-brand-cta px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cta btn-premium disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgot}>
              <div>
                <label className="block text-sm font-semibold leading-6 text-brand-navy">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="employee@nextitpoint.com"
                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-cta sm:text-sm sm:leading-6 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-brand-cta px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-blue-700 btn-premium disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Requesting...' : 'Generate Reset Token'}
                </button>

                {forgotSuccess && (
                  <button
                    type="button"
                    onClick={() => setView('reset')}
                    className="flex w-full justify-center items-center gap-2 rounded-lg bg-brand-navy px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-slate-800 btn-premium cursor-pointer"
                  >
                    Go to Reset Password
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm font-medium text-brand-link hover:underline text-center mt-2 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {view === 'reset' && (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-sm font-semibold leading-6 text-brand-navy">
                  Reset Token
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token"
                    className="block w-full rounded-lg border-0 py-2.5 px-3.5 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-cta sm:text-sm sm:leading-6 bg-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold leading-6 text-brand-navy">
                  New Password
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-cta sm:text-sm sm:leading-6 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-brand-cta px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-blue-700 btn-premium disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Resetting...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm font-medium text-brand-link hover:underline text-center mt-2 cursor-pointer"
                >
                  Cancel & Back to Login
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
      
      {/* Footer Info */}
      <p className="mt-10 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Next IT Point. All rights reserved.
      </p>
    </div>
  );
}
