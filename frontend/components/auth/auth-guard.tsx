'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { buildLoginUrl } from '@/lib/auth-routes';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/browse',
  '/shop',
  '/cart',
  '/wishlist',
  '/videos',
  '/terms',
  '/privacy',
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
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  const isPublicRoute =
    publicRoutes.some((route) => matchesRoute(pathname, route)) ||
    sellerPublicRoutes.some((route) => matchesRoute(pathname, route));

  const isAuthPage = ['/login', '/register', '/forgot-password'].some((route) =>
    matchesRoute(pathname, route),
  );

  useEffect(() => {
    const timeout = setTimeout(() => setIsChecking(false), 2000);

    if (isLoading) return;

    const isSellerRoute = sellerRoutes.some((route) => matchesRoute(pathname, route));
    const isAdminRoute = adminRoutes.some((route) => matchesRoute(pathname, route));

    if (!isAuthenticated && !isPublicRoute && !isAuthPage) {
      const intent = isSellerIntentPath(pathname) ? 'seller' : 'customer';
      router.push(buildLoginUrl({ intent, redirect: pathname }));
      clearTimeout(timeout);
      setIsChecking(false);
      return;
    }

    if (isAuthenticated && isSellerRoute && user?.role !== 'seller' && user?.role !== 'admin') {
      router.push('/seller-onboarding');
      clearTimeout(timeout);
      setIsChecking(false);
      return;
    }

    if (isAuthenticated && isAdminRoute && user?.role !== 'admin') {
      router.push('/');
      clearTimeout(timeout);
      setIsChecking(false);
      return;
    }

    clearTimeout(timeout);
    setIsChecking(false);
  }, [isLoading, isAuthenticated, user, pathname, router, isPublicRoute, isAuthPage]);

  if (isLoading && isChecking && !isPublicRoute && !isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
