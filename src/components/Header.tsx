'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon, Bell, Check } from 'lucide-react';
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
      
      // Setup interval for notifications polling (every 30s is fine)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'HR_ADMIN':
        return 'bg-purple-50 text-purple-700 border border-purple-200/60';
      case 'TL':
        return 'bg-blue-50 text-blue-700 border border-blue-200/60';
      default:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white px-6 py-3.5 shadow-sm border-b border-gray-200 flex items-center justify-between text-brand-navy">
      {/* Brand logo image */}
      <Link href="/" className="select-none flex items-center transition-all">
        <img 
          src="/logo.png" 
          alt="Next IT Point Logo" 
          className="h-9 w-auto object-contain"
        />
      </Link>

      {/* Navigation */}
      {user && (
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {user.role === 'HR_ADMIN' && (
            <>
              <Link
                href="/admin"
                className={`hover:text-brand-navy transition-colors pb-1 ${
                  pathname.startsWith('/admin') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-brand-navy/70 hover:text-brand-navy'
                }`}
              >
                HR Panel
              </Link>
              <Link
                href="/tl"
                className={`hover:text-brand-navy transition-colors pb-1 ${
                  pathname.startsWith('/tl') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-brand-navy/70 hover:text-brand-navy'
                }`}
              >
                TL Board
              </Link>
            </>
          )}

          {user.role === 'TL' && (
            <Link
              href="/tl"
              className={`hover:text-brand-navy transition-colors pb-1 ${
                pathname.startsWith('/tl') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-brand-navy/70 hover:text-brand-navy'
              }`}
            >
              Team Leader Board
            </Link>
          )}
        </nav>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 text-brand-navy/70 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer outline-none border border-slate-200 ${unreadCount > 0 ? 'notif-pulse' : ''}`}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-brand-red text-white text-[8px] font-extrabold flex items-center justify-center rounded-full px-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden py-1">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">Notifications</span>
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

            <div className="flex flex-col text-right items-end hidden sm:flex">
              <span className="text-sm font-bold text-brand-navy flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-brand-navy/80" />
                {user.name}
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full mt-0.5 ${getRoleBadge(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-50 text-brand-navy hover:bg-slate-100 font-bold text-xs sm:text-sm px-4 py-2 hover:shadow-md border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Internal App</span>
        )}
      </div>
    </header>
  );
}
