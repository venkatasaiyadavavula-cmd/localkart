'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/verify-otp',
  '/browse',
  '/product',
  '/shop',
  '/about',
  '/contact',
];

// Routes that require seller role
const sellerRoutes = ['/seller', '/seller-onboarding'];

// Routes that require admin role
const adminRoutes = ['/admin'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );

    const isSellerRoute = sellerRoutes.some(
      (route) => pathname.startsWith(route)
    );

    const isAdminRoute = adminRoutes.some(
      (route) => pathname.startsWith(route)
    );

    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If authenticated but trying to access seller route without seller role
    if (isAuthenticated && isSellerRoute && user?.role !== 'seller' && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    // If authenticated but trying to access admin route without admin role
    if (isAuthenticated && isAdminRoute && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsChecking(false);
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
