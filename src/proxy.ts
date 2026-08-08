import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (user) {
    if (pathname === '/') {
      if (user.role === 'HR_ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      } else if (user.role === 'TL') {
        return NextResponse.redirect(new URL('/tl', req.url));
      } else {
        return NextResponse.redirect(new URL('/employee', req.url));
      }
    }

    if (pathname.startsWith('/admin') && user.role !== 'HR_ADMIN') {
      const target = user.role === 'TL' ? '/tl' : '/employee';
      return NextResponse.redirect(new URL(target, req.url));
    }

    if (pathname.startsWith('/tl') && user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/employee', req.url));
    }

    if (pathname.startsWith('/employee') && user.role !== 'EMPLOYEE' && user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  } else {
    const protectedPaths = ['/employee', '/tl', '/admin'];
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
    
    if (isProtected) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
