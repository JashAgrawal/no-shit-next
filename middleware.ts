import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Heuristic: Better Auth stores a session cookie; if absent, redirect
    const hasSessionCookie = Array.from(req.cookies.getAll()).some((c) =>
      c.name.toLowerCase().includes('better-auth') || c.name.toLowerCase().includes('session')
    );

    if (!hasSessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
