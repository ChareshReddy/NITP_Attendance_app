import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Read session token from cookie
  const token = request.cookies.get('session_token')?.value;

  // Let public files, static files, and api routes pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Verify JWT token
  const user = token ? await verifyJWT(token) : null;

  if (user) {
    // If logged in and attempting to visit login page, redirect to their panel
    if (pathname === '/') {
      if (user.role === 'HR_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (user.role === 'TL') {
        return NextResponse.redirect(new URL('/tl', request.url));
      } else {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && user.role !== 'HR_ADMIN') {
      const target = user.role === 'TL' ? '/tl' : '/employee';
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith('/tl') && user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }

    if (pathname.startsWith('/employee') && user.role !== 'EMPLOYEE' && user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // User is NOT logged in
    const protectedPaths = ['/employee', '/tl', '/admin'];
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
    
    if (isProtected) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
