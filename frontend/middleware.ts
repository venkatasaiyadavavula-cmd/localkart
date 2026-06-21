import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth checks are handled client-side by AuthGuard (components/auth/auth-guard.tsx)
  // since tokens are stored in localStorage, which server-side middleware cannot read.
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
