import { NextRequest, NextResponse } from 'next/server';

// Supabase @supabase/ssr createBrowserClient automatically manages
// cookies named `sb-<project-ref>-auth-token`. We check for any such
// cookie here without importing @supabase/ssr so the middleware
// stays compatible with the Next.js Edge runtime.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the login page and auth API routes through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Supabase sets an `sb-*-auth-token` cookie when signed in
  const hasSession = request.cookies
    .getAll()
    .some((c) => /^sb-.+-auth-token$/.test(c.name));

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
