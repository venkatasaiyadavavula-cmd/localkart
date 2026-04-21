import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value || request.headers.get('Authorization');
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ['/checkout', '/profile', '/orders', '/seller', '/admin'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  // Auth routes (redirect if already logged in)
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.includes(pathname);

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*', '/profile/:path*', '/orders/:path*', '/seller/:path*', '/admin/:path*', '/login', '/register'],
};
