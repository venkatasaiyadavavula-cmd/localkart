import { redirect } from 'next/navigation';
import { SellerOnboardingGate } from '@/components/seller/seller-onboarding-gate';
import { SellerPendingScreen } from '@/components/seller/seller-pending-screen';
import { SellerRejectedScreen } from '@/components/seller/seller-rejected-screen';
import { SellerSuspendedScreen } from '@/components/seller/seller-suspended-screen';
import { getServerSession, hasAccessTokenCookie } from '@/lib/auth';
import { authTrace } from '@/lib/auth-trace';
import {
  resolveSellerShopContext,
  shouldAllowDashboard,
  shouldShowOnboardingForm,
  shouldShowPendingScreen,
  shouldShowRejectedScreen,
  shouldShowSuspendedScreen,
} from '@/lib/seller-shop-routing';

export default async function SellerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasToken = hasAccessTokenCookie();
  const session = await getServerSession();

  if (!session) {
    if (!hasToken) {
      authTrace('seller-layout', { action: 'redirect-login', route: 'onboarding' });
      redirect('/login?intent=seller&redirect=/seller-onboarding');
    }
    return <SellerOnboardingGate>{children}</SellerOnboardingGate>;
  }

  if (session.user.role !== 'seller') {
    authTrace('seller-layout', { action: 'redirect-login', route: 'onboarding', role: session.user.role });
    redirect('/login?intent=seller&redirect=/seller-onboarding');
  }

  const ctx = resolveSellerShopContext(session.user);

  if (shouldAllowDashboard(ctx)) {
    authTrace('seller-layout', { action: 'redirect-dashboard', route: 'onboarding', shopStatus: ctx.shopStatus });
    redirect('/dashboard');
  }

  if (shouldShowPendingScreen(ctx)) {
    authTrace('seller-layout', { action: 'pending-screen', route: 'onboarding', shopStatus: ctx.shopStatus });
    return (
      <SellerPendingScreen shopName={ctx.shopName} submittedAt={ctx.submittedAt} />
    );
  }

  if (shouldShowRejectedScreen(ctx)) {
    authTrace('seller-layout', { action: 'rejected-screen', route: 'onboarding', shopStatus: ctx.shopStatus });
    return <SellerRejectedScreen shopName={ctx.shopName} />;
  }

  if (shouldShowSuspendedScreen(ctx)) {
    authTrace('seller-layout', { action: 'suspended-screen', route: 'onboarding', shopStatus: ctx.shopStatus });
    return <SellerSuspendedScreen shopName={ctx.shopName} />;
  }

  if (shouldShowOnboardingForm(ctx)) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
