'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');

  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  // Remembered username on mount
  useEffect(() => {
    const saved = localStorage.getItem('nitp_remembered_user');
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

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
        email: username,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === 'DEACTIVATED' || res.error.includes('DEACTIVATED')) {
          throw new Error('Account is deactivated. Please contact HR/Admin.');
        }
        throw new Error('Invalid Employee ID or password');
      }

      if (rememberMe) {
        localStorage.setItem('nitp_remembered_user', username);
      } else {
        localStorage.removeItem('nitp_remembered_user');
      }

      // Fetch user session to determine role redirect
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role;

      if (role === 'HR_ADMIN') {
        router.push('/admin');
      } else if (role === 'TL') {
        router.push('/employee');
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
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col md:flex-row bg-[#080d1a] text-slate-100 font-sans select-none">
      
      {/* =========================================
          LEFT BRAND PANEL (Navy Blue with Dots Decor)
          ========================================= */}
      <aside className="relative w-full md:w-[52%] lg:w-[54%] h-auto md:h-full flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 overflow-hidden shrink-0 bg-gradient-to-br from-[#0c2653] via-[#0f3b82] to-[#1259cb]">
        
        {/* Subtle Dots & Glow Pattern Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.15) 0%, transparent 45%),
              radial-gradient(circle at 82% 82%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
              radial-gradient(rgba(255, 255, 255, 0.22) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '100% 100%, 100% 100%, 28px 28px',
          }}
        />

        {/* Top Header: Next IT Point White Pill Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="bg-white rounded-xl px-4 py-2 shadow-lg inline-flex items-center">
            <img 
              src="/logo.png" 
              alt="Next IT Point Logo" 
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
        </div>

        {/* Center Content: Attendance & Time Tracker Vector Art & Heading */}
        <div className="relative z-10 my-auto py-6 md:py-0 flex flex-col items-center text-center max-w-xl mx-auto">
          
          {/* Custom Attendance Portal Illustration */}
          <div className="w-full max-w-[340px] sm:max-w-[400px] mb-6 drop-shadow-2xl">
            <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <defs>
                <linearGradient id="portal-card-grad" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" />
                  <stop offset="1" stopColor="#f8fafc" />
                </linearGradient>
                <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="clock-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="checkin-btn-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#1155cc" />
                  <stop offset="1" stopColor="#0d3b8e" />
                </linearGradient>
                <filter id="card-shadow" x="-20" y="-10" width="460" height="260" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#001438" floodOpacity="0.32" />
                </filter>
                <filter id="icon-shadow" x="-10" y="-10" width="80" height="80" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Background Stacked Card 1 */}
              <rect x="52" y="24" width="310" height="180" rx="18" fill="#ffffff" fillOpacity="0.25" transform="rotate(-4 52 24)" />
              {/* Background Stacked Card 2 */}
              <rect x="70" y="16" width="300" height="180" rx="18" fill="#ffffff" fillOpacity="0.45" transform="rotate(2 70 16)" />

              {/* Main Attendance Dashboard Card */}
              <g filter="url(#card-shadow)">
                <rect x="68" y="22" width="324" height="196" rx="18" fill="url(#portal-card-grad)" stroke="#cbd5e1" strokeWidth="1" />
                
                {/* Header bar of the Card */}
                <rect x="68" y="22" width="324" height="42" rx="18" fill="#0d2856" />
                <rect x="68" y="50" width="324" height="14" fill="#0d2856" />
                
                {/* Window Dots */}
                <circle cx="92" cy="43" r="4.5" fill="#ef4444" />
                <circle cx="106" cy="43" r="4.5" fill="#f59e0b" />
                <circle cx="120" cy="43" r="4.5" fill="#10b981" />
                
                {/* Card Title text placeholder */}
                <rect x="144" y="38" width="100" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.9" />
                <rect x="330" y="38" width="44" height="9" rx="4.5" fill="#60a5fa" fillOpacity="0.8" />

                {/* Sub-Header Stats Row */}
                <rect x="88" y="76" width="70" height="7" rx="3.5" fill="#94a3b8" />
                <rect x="88" y="88" width="120" height="13" rx="4" fill="#0f172a" />

                {/* Today's Punch Time Stamp Badge */}
                <rect x="238" y="74" width="134" height="30" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="254" cy="89" r="6" fill="#10b981" />
                <rect x="268" y="84" width="60" height="5.5" rx="2.5" fill="#1e293b" />
                <rect x="268" y="92" width="40" height="4" rx="2" fill="#64748b" />

                {/* Divider Line */}
                <line x1="88" y1="116" x2="372" y2="116" stroke="#e2e8f0" strokeWidth="1" />

                {/* Weekly Bar Chart Preview */}
                <rect x="88" y="132" width="14" height="44" rx="4" fill="#93c5fd" />
                <rect x="110" y="124" width="14" height="52" rx="4" fill="#3b82f6" />
                <rect x="132" y="138" width="14" height="38" rx="4" fill="#93c5fd" />
                <rect x="154" y="120" width="14" height="56" rx="4" fill="#2563eb" />
                <rect x="176" y="128" width="14" height="48" rx="4" fill="#1d4ed8" />
                
                {/* Check In Action Box */}
                <g filter="url(#card-shadow)">
                  <rect x="234" y="130" width="138" height="44" rx="10" fill="url(#checkin-btn-grad)" />
                  <rect x="254" y="146" width="60" height="6" rx="3" fill="#ffffff" />
                  <path d="M336 148l4 4 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="340" cy="152" r="9" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" />
                </g>

                {/* Status Indicator Bar at bottom */}
                <rect x="88" y="190" width="80" height="5" rx="2.5" fill="#cbd5e1" />
                <rect x="290" y="190" width="82" height="5" rx="2.5" fill="#cbd5e1" />
              </g>

              {/* Overlapping Floating Shield Badge (Top Right) */}
              <g filter="url(#icon-shadow)">
                <path d="M380 18c14 0 24-7 24-7v22c0 20-14 33-24 38-10-5-24-18-24-38V11s10 7 24 7z" fill="url(#shield-grad)" />
                <path d="M372 39l5 5 12-12" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Overlapping Floating Clock Badge (Bottom Left) */}
              <g filter="url(#icon-shadow)">
                <circle cx="58" cy="188" r="26" fill="url(#clock-grad)" stroke="#ffffff" strokeWidth="3" />
                <circle cx="58" cy="188" r="22" fill="#fbbf24" fillOpacity="0.2" />
                {/* Clock Hands */}
                <circle cx="58" cy="188" r="3" fill="#ffffff" />
                <path d="M58 174v14l9 6" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Next IT Point Attendance Portal
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-blue-100/90 max-w-md font-normal leading-relaxed">
            Mark daily attendance, submit work timesheets, regularise punches, and manage team requests in real-time.
          </p>
        </div>

        {/* Footer: Legal Notice */}
        <div className="relative z-10 text-[11px] sm:text-xs text-blue-200/70 font-medium">
          &copy; {new Date().getFullYear()} Next IT Point Intellectual Services Pvt. Ltd.
        </div>
      </aside>


      {/* =========================================
          RIGHT FORM PANE (Dark Sleek Glassmorphism Card)
          ========================================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-10 lg:p-12 overflow-y-auto bg-[#0a0f1d] relative">
        
        {/* Subtle Ambient Background Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-10">
          
          {/* Frosted Modern Card Container */}
          <div className="relative bg-[#111827]/90 border border-blue-500/20 rounded-[24px] p-7 sm:p-9 shadow-2xl backdrop-blur-xl overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3.5px] before:bg-gradient-to-r before:from-blue-600 before:via-blue-400 before:to-transparent">
            
            {/* Lock Icon Badge */}
            <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/80 text-blue-400 flex items-center justify-center mb-4 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {view === 'login' && 'Welcome back'}
              {view === 'forgot' && 'Reset your password'}
              {view === 'reset' && 'Create new password'}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-400 mt-1 mb-6">
              {view === 'login' && 'Sign in to your attendance portal.'}
              {view === 'forgot' && 'Enter your email to receive a password reset token.'}
              {view === 'reset' && 'Provide your reset token and your new password.'}
            </p>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 rounded-xl bg-red-950/40 border border-red-500/40 p-3 text-xs font-semibold text-red-200 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {success && (
              <div className="mb-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-3 text-xs font-semibold text-emerald-200 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="leading-snug">{success}</p>
                  {demoToken && (
                    <div className="mt-2 p-2 bg-slate-900 border border-emerald-500/30 rounded font-mono text-xs text-emerald-300 select-all break-all">
                      Demo Token: {demoToken}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 1: LOGIN FORM */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Employee ID / Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Employee ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. NITP0021 or rohini.hr@nextitpoint.com"
                      autoComplete="username"
                      className="w-full bg-[#1e293b]/90 border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full bg-[#1e293b]/90 border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500/20 focus:ring-2 cursor-pointer accent-blue-600"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1155cc] to-[#0c3f9c] hover:from-[#1664ee] hover:to-[#0d46ae] shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            )}

            {/* VIEW 2: FORGOT PASSWORD */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. employee@nextitpoint.com"
                      className="w-full bg-[#1e293b]/90 border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1155cc] to-[#0c3f9c] hover:from-[#1664ee] hover:to-[#0d46ae] shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Generating Token...' : 'Generate Reset Token'}
                  </button>

                  {forgotSuccess && (
                    <button
                      type="button"
                      onClick={() => setView('reset')}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-blue-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                    >
                      Go to Reset Password
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 text-center mt-2 cursor-pointer transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: RESET PASSWORD */}
            {view === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste your reset token"
                    className="w-full bg-[#1e293b]/90 border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-[#1e293b]/90 border border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1155cc] to-[#0c3f9c] hover:from-[#1664ee] hover:to-[#0d46ae] shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 text-center mt-2 cursor-pointer transition-colors"
                  >
                    Cancel & Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Footer Support Hints */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-400 space-y-1">
              <p>HR staff: sign in with your administrator credentials.</p>
              <p>
                Need help? Contact HR at{' '}
                <a href="mailto:hr@nextitpoint.com" className="text-blue-400 hover:underline font-semibold">
                  hr@nextitpoint.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
