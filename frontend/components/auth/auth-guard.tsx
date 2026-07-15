'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { buildLoginUrl } from '@/lib/auth-routes';
import { authTrace } from '@/lib/auth-trace';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/browse',
  '/shop',
  '/cart',
  '/videos',
  '/terms',
  '/privacy',
  '/about',
  '/orders/track',
];

const sellerPublicRoutes: string[] = [];

const sellerRoutes = ['/seller', '/dashboard'];
const adminRoutes = ['/admin'];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(route + '/');
}

function isSellerIntentPath(pathname: string) {
  return pathname === '/seller-onboarding' ||
    sellerRoutes.some((route) => matchesRoute(pathname, route));
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const [authResolved, setAuthResolved] = useState(false);

  const isWorkRoute = pathname.startsWith('/work');

  const isPublicRoute =
    publicRoutes.some((route) => matchesRoute(pathname, route)) ||
    sellerPublicRoutes.some((route) => matchesRoute(pathname, route));

  const isAuthPage = ['/login', '/register', '/forgot-password'].some((route) =>
    matchesRoute(pathname, route),
  );

  useEffect(() => {
    if (isWorkRoute) return;

    if (!_hasHydrated || isLoading) {
      authTrace('guard-effect', {
        pathname,
        phase: 'waiting-store',
        _hasHydrated,
        isLoading,
      });
      setAuthResolved(false);
      return;
    }

    const isSellerRoute = sellerRoutes.some((route) => matchesRoute(pathname, route));
    const isAdminRoute = adminRoutes.some((route) => matchesRoute(pathname, route));

    authTrace('guard-effect', {
      pathname,
      phase: 'checking',
      isAuthenticated,
      role: user?.role ?? null,
    });

    if (!isAuthenticated && !isPublicRoute && !isAuthPage) {
      const intent = isSellerIntentPath(pathname) ? 'seller' : 'customer';
      authTrace('guard-redirect', { pathname, reason: 'unauthenticated', intent });
      router.push(buildLoginUrl({ intent, redirect: pathname }));
      setAuthResolved(true);
      return;
    }

    if (isAuthenticated && isSellerRoute && user?.role !== 'seller' && user?.role !== 'admin') {
      authTrace('guard-redirect', { pathname, reason: 'not-seller' });
      router.push('/seller-onboarding');
      setAuthResolved(true);
      return;
    }

    if (isAuthenticated && isAdminRoute && user?.role !== 'admin') {
      authTrace('guard-redirect', { pathname, reason: 'not-admin' });
      router.push('/');
      setAuthResolved(true);
      return;
    }

    authTrace('guard-resolved', { pathname, isAuthenticated, role: user?.role ?? null });
    setAuthResolved(true);
  }, [isWorkRoute, _hasHydrated, isLoading, isAuthenticated, user, pathname, router, isPublicRoute, isAuthPage]);

  // Staff /work routes use a separate auth system (useStaffAuth) — skip main guard entirely.
  if (isWorkRoute) {
    return <>{children}</>;
  }

  const awaitingAuth = !_hasHydrated || isLoading || !authResolved;

  if (awaitingAuth && !isPublicRoute && !isAuthPage) {
    authTrace('guard-await', {
      pathname,
      _hasHydrated,
      isLoading,
      authResolved,
    });
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
