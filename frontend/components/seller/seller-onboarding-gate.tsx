'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import {
  resolveSellerShopContext,
  shouldAllowDashboard,
  shouldShowOnboardingForm,
  shouldShowPendingScreen,
  shouldShowRejectedScreen,
  shouldShowSuspendedScreen,
  type SellerShopUser,
} from '@/lib/seller-shop-routing';
import { SellerPendingScreen } from '@/components/seller/seller-pending-screen';
import { SellerRejectedScreen } from '@/components/seller/seller-rejected-screen';
import { SellerSuspendedScreen } from '@/components/seller/seller-suspended-screen';
import { Skeleton } from '@/components/ui/skeleton';

export function SellerOnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seller', 'onboarding-gate'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/profile');
      return unwrapApiData<SellerShopUser & { role?: string }>(data);
    },
    retry: 1,
    staleTime: 30_000,
  });

  const ctx = resolveSellerShopContext(profile);

  useEffect(() => {
    if (!profile || isLoading) return;
    if (shouldAllowDashboard(ctx)) {
      router.replace('/dashboard');
    }
  }, [profile, isLoading, ctx, router]);

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-8">
        <Skeleton className="h-96 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (shouldShowPendingScreen(ctx)) {
    return <SellerPendingScreen shopName={ctx.shopName} submittedAt={ctx.submittedAt} />;
  }

  if (shouldShowRejectedScreen(ctx)) {
    return <SellerRejectedScreen shopName={ctx.shopName} />;
  }

  if (shouldShowSuspendedScreen(ctx)) {
    return <SellerSuspendedScreen shopName={ctx.shopName} />;
  }

  if (shouldAllowDashboard(ctx)) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-8">
        <Skeleton className="h-96 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (shouldShowOnboardingForm(ctx)) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
