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

  const [isMuted, setIsMuted] = useState(true);

  // Attempt autoplay with audio on client load
  useEffect(() => {
    const videoElement = document.getElementById('login-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = false;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay with audio was blocked, fallback to muted autoplay
          videoElement.muted = true;
          setIsMuted(true);
          videoElement.play().catch(err => console.log("Muted autoplay also blocked:", err));
        });
      } else {
        setIsMuted(false);
      }
    }
  }, []);

  const toggleMute = () => {
    const videoElement = document.getElementById('login-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !videoElement.muted;
      setIsMuted(videoElement.muted);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent relative">
      
      {/* Left Column: Autoplay Looping Hero Video Panel */}
      <div className="relative w-full md:w-[50%] lg:w-[55%] h-64 md:h-screen shrink-0 overflow-hidden bg-brand-navy">
        <video
          id="login-video"
          src="/login-hero.mp4"
          autoPlay
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Speaker Volume Controller Action Button */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-4 right-4 z-10 p-2.5 rounded-full bg-brand-navy/85 hover:bg-brand-navy text-white transition-all shadow-md backdrop-blur-xs flex items-center justify-center cursor-pointer border border-white/10 hover:scale-105 active:scale-95"
          title={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H1.5v6h3l4.5 3.75V5.25z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          )}
        </button>
      </div>

      {/* Right Column: Existing Login Forms and Branding */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 md:px-16 lg:px-20 xl:px-24 overflow-y-auto h-auto md:h-screen bg-transparent">
        <div className="mx-auto w-full max-w-md">
          
          {/* Logo Branding */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Next IT Point Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>
          
          <h2 className="text-center text-xl font-bold tracking-tight text-brand-navy font-heading">
            {view === 'login' && 'Sign in to your account'}
            {view === 'forgot' && 'Reset your password'}
            {view === 'reset' && 'Create new password'}
          </h2>

          <div className="mt-8">
            <div className="py-10 px-8 premium-card">
              
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
                        <Mail className="h-5 w-5 text-brand-navy-light" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="employee@nextitpoint.com"
                        className="block w-full rounded-xl border border-gray-200/80 py-2.5 pl-10 text-brand-gray placeholder:text-gray-400 focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all bg-white/70 backdrop-blur-xs outline-none sm:text-sm shadow-xs"
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
                        <Lock className="h-5 w-5 text-brand-navy-light" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full rounded-xl border border-gray-200/80 py-2.5 pl-10 text-brand-gray placeholder:text-gray-400 focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all bg-white/70 backdrop-blur-xs outline-none sm:text-sm shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-cta px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-md hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cta btn-premium disabled:opacity-50 cursor-pointer transition-all"
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
                        <Mail className="h-5 w-5 text-brand-navy-light" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="employee@nextitpoint.com"
                        className="block w-full rounded-xl border border-gray-200/80 py-2.5 pl-10 text-brand-gray placeholder:text-gray-400 focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all bg-white/70 backdrop-blur-xs outline-none sm:text-sm shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-cta px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-md hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 btn-premium disabled:opacity-50 cursor-pointer transition-all"
                    >
                      {loading ? 'Requesting...' : 'Generate Reset Token'}
                    </button>

                    {forgotSuccess && (
                      <button
                        type="button"
                        onClick={() => setView('reset')}
                        className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-navy px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-md hover:bg-slate-800 hover:shadow-lg hover:shadow-brand-navy/15 btn-premium cursor-pointer transition-all"
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
                        className="block w-full rounded-xl border border-gray-200/80 py-2.5 px-3.5 text-brand-gray placeholder:text-gray-400 focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all bg-white/70 backdrop-blur-xs outline-none sm:text-sm font-mono shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold leading-6 text-brand-navy">
                      New Password
                    </label>
                    <div className="relative mt-2">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-brand-navy-light" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full rounded-xl border border-gray-200/80 py-2.5 pl-10 text-brand-gray placeholder:text-gray-400 focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all bg-white/70 backdrop-blur-xs outline-none sm:text-sm shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-cta px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-md hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 btn-premium disabled:opacity-50 cursor-pointer transition-all"
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
          <p className="mt-8 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Next IT Point. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
