'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon, Bell, Check, Lock } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [userRating, setUserRating] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Dropdown & Password Change Modal States
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [submittingPass, setSubmittingPass] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  function formatEmployeeName(nameVal: string | null | undefined): string {
    if (!nameVal) return '-';
    const capitalized = nameVal
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const parts = capitalized.split(' ');
    if (parts.length > 1 && parts[0].length === 1) {
      const initial = parts.shift();
      parts.push(initial!);
      return parts.join(' ');
    }
    return capitalized;
  }

  function formatToTitleCase(text: string | null | undefined): string {
    if (!text) return '';
    if (text === 'TL') return 'Team Leader';
    if (text === 'HR_ADMIN') return 'HR / Admin';
    return text
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  }

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Session fetch failed in header:', e);
      }
    }
    fetchSession();
  }, [pathname]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPerformance();
      fetchProfileImage();
      
      const handleImageUpdateEvent = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          setProfileImage(customEvent.detail);
        } else {
          fetchProfileImage();
        }
      };
      window.addEventListener('profileImageUpdated', handleImageUpdateEvent);

      // Setup interval for notifications polling (every 30s is fine)
      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('profileImageUpdated', handleImageUpdateEvent);
      };
    }
  }, [user]);

  const fetchProfileImage = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile && data.profile.profileImage) {
          setProfileImage(data.profile.profileImage);
        } else {
          setProfileImage(null);
        }
      }
    } catch (e) {
      console.error('Profile fetch failed in header:', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Notifications fetch failed:', e);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch('/api/admin/performance');
      if (res.ok) {
        const data = await res.json();
        if (data.performanceData && data.performanceData.length > 0) {
          const personalData = data.performanceData.find((p: any) => p.user.id === user?.id);
          if (personalData?.score?.rating) {
            setUserRating(personalData.score.rating);
          }
        }
      }
    } catch (e) {
      console.error('Performance fetch failed:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case 'BLUE':
        return 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm';
      case 'GREEN':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm';
      case 'YELLOW':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm';
      case 'RED':
        return 'bg-red-50 text-brand-red border border-red-200/60 shadow-sm';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200/60';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (newPass !== confirmNewPass) {
      setModalError('New passwords do not match');
      return;
    }

    setSubmittingPass(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      setModalSuccess('Password updated successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
      setTimeout(() => {
        setIsPassModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'Error changing password');
    } finally {
      setSubmittingPass(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'HR_ADMIN':
        return 'bg-purple-500/35 text-purple-100 border border-purple-400/40';
      case 'TL':
        return 'bg-blue-500/35 text-blue-100 border border-blue-400/40';
      default:
        return 'bg-emerald-500/35 text-emerald-100 border border-emerald-400/40';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-navy px-6 py-3.5 shadow-md flex items-center justify-between text-white">
      {/* Brand logo image */}
      <a 
        href={user ? (user.role === 'HR_ADMIN' ? '/admin' : user.role === 'TL' ? '/employee' : '/employee') : '/'} 
        className="select-none flex items-center transition-all bg-white px-3 py-1 rounded-xl shadow-xs cursor-pointer"
      >
        <img 
          src="/logo.png" 
          alt="Next IT Point Logo" 
          className="h-8 w-auto object-contain"
        />
      </a>

      {/* Navigation */}
      {user && (
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {user.role === 'HR_ADMIN' && (
            <>
              <Link
                href="/admin"
                className={`transition-colors pb-1 ${
                  pathname.startsWith('/admin') ? 'text-white border-b-2 border-white' : 'text-white/70 hover:text-white'
                }`}
              >
                HR Panel
              </Link>
              <Link
                href="/tl"
                className={`transition-colors pb-1 ${
                  pathname.startsWith('/tl') ? 'text-white border-b-2 border-white' : 'text-white/70 hover:text-white'
                }`}
              >
                TL Board
              </Link>
            </>
          )}

          {user.role === 'TL' && (
            <>
              <Link
                href="/employee"
                className={`transition-colors pb-1 ${
                  pathname.startsWith('/employee') ? 'text-white border-b-2 border-white' : 'text-white/70 hover:text-white'
                }`}
              >
                My Portal
              </Link>
              <Link
                href="/tl"
                className={`transition-colors pb-1 ${
                  pathname.startsWith('/tl') ? 'text-white border-b-2 border-white' : 'text-white/70 hover:text-white'
                }`}
              >
                Team Leader Board
              </Link>
            </>
          )}
        </nav>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mr-4 md:mr-6">
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer outline-none border border-white/15 ${unreadCount > 0 ? 'notif-pulse' : ''}`}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-brand-red text-white text-[8px] font-extrabold flex items-center justify-center rounded-full px-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden py-1">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="text-xs font-extrabold text-brand-navy tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-brand-cta hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 custom-scrollbar-container">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                           key={n.id} 
                          className={`p-3 text-left transition-colors flex flex-col gap-1 relative ${!n.read ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <p className="text-[11px] text-brand-navy leading-normal font-medium">{n.message}</p>
                            {!n.read && (
                              <button 
                                onClick={() => handleMarkRead(n.id)}
                                className="text-[9px] font-bold text-brand-cta hover:text-blue-700 shrink-0 cursor-pointer"
                                title="Mark read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[8px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer outline-none text-left"
              >
                <div className="flex flex-col text-right items-end hidden sm:flex">
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    {formatEmployeeName(user.name)}
                  </span>
                  <span className={`text-[10px] font-extrabold tracking-wide px-2.5 py-0.5 rounded-full mt-0.5 ${getRoleBadge(user.role)}`}>
                    {user.id.length > 15 ? 'NITP00021' : user.id}
                  </span>
                </div>
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={user.name} 
                    className="w-[36px] h-[36px] rounded-full object-cover border-2 border-white/60"
                  />
                ) : (
                  <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      router.push('/employee?tab=profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-brand-navy flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-brand-navy/60" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsPassModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-brand-navy flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-brand-navy/60" />
                    Change Password
                  </button>
                  <div className="border-t border-gray-100 my-1.5"></div>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 text-brand-red flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-brand-red/60" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <span className="text-xs text-gray-400 font-semibold tracking-wider">Internal App</span>
        )}
      </div>

      {isPassModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-brand-navy font-heading">Change Password</h3>
              <p className="text-xs text-gray-500 mt-1">Verify current credentials to update your password.</p>
            </div>

            {modalError && <p className="text-xs text-brand-red font-semibold">{modalError}</p>}
            {modalSuccess && <p className="text-xs text-emerald-600 font-semibold">{modalSuccess}</p>}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-brand-navy mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="block w-full rounded-xl border border-gray-250 py-2 px-3 text-xs text-brand-gray bg-white/70 outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-navy mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="block w-full rounded-xl border border-gray-250 py-2 px-3 text-xs text-brand-gray bg-white/70 outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-navy mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  className="block w-full rounded-xl border border-gray-250 py-2 px-3 text-xs text-brand-gray bg-white/70 outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsPassModalOpen(false);
                    setCurrentPass('');
                    setNewPass('');
                    setConfirmNewPass('');
                    setModalError('');
                    setModalSuccess('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPass}
                  className="bg-brand-cta hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  {submittingPass ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-brand-red mx-auto shadow-xs">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider">Confirm Logout</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Are you sure you want to log out of your session?</p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs w-24"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  handleLogout();
                }}
                className="bg-brand-red hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md w-24"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
