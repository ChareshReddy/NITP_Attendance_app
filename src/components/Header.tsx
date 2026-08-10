'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);

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
        return 'bg-purple-100 text-purple-800';
      case 'TL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-emerald-100 text-emerald-800';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md px-6 py-3.5 shadow-sm flex items-center justify-between">
      {/* Brand logo image */}
      <Link href="/" className="select-none flex items-center">
        <img 
          src="/logo.png" 
          alt="Next IT Point Logo" 
          className="h-10 w-auto object-contain"
        />
      </Link>

      {/* Navigation */}
      {user && (
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {user.role === 'HR_ADMIN' && (
            <>
              <Link
                href="/admin"
                className={`hover:text-brand-navy transition-colors ${
                  pathname.startsWith('/admin') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                HR Panel
              </Link>
              <Link
                href="/tl"
                className={`hover:text-brand-navy transition-colors ${
                  pathname.startsWith('/tl') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                TL Board
              </Link>
            </>
          )}

          {user.role === 'TL' && (
            <Link
              href="/tl"
              className={`hover:text-brand-navy transition-colors ${
                pathname.startsWith('/tl') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Team Leader Board
            </Link>
          )}

          {user.role !== 'HR_ADMIN' && (
            <Link
              href="/employee"
              className={`hover:text-brand-navy transition-colors ${
                pathname.startsWith('/employee') ? 'text-brand-navy border-b-2 border-brand-navy' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Portal
            </Link>
          )}
        </nav>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex flex-col text-right items-end hidden sm:flex">
              <span className="text-sm font-bold text-brand-navy flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-brand-navy" />
                {user.name}
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full mt-0.5 ${getRoleBadge(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-brand-cta text-white font-bold text-xs sm:text-sm px-4 py-2 hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer btn-premium shadow-sm"
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
