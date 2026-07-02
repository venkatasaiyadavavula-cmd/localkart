'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

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
  '/cart',
  '/wishlist',
  '/videos',
  '/orders',
  '/profile',
];

const sellerRoutes = ['/seller', '/dashboard'];
const adminRoutes = ['/admin'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Max 3 seconds wait - timeout fix
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 3000);

    if (isLoading) return;

    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );

    const isSellerRoute = sellerRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/'),
    );
    const isAdminRoute = adminRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/'),
    );

    if (!isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      clearTimeout(timeout);
      setIsChecking(false);
      return;
    }

    if (isAuthenticated && isSellerRoute && user?.role !== 'seller' && user?.role !== 'admin') {
      router.push('/');
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
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading && isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
