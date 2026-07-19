import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SellerHeader } from '@/components/seller/seller-header';
import { SellerSidebar } from '@/components/seller/seller-sidebar';
import { SellerSuspendedGate } from '@/components/seller/seller-suspended-gate';
import { SellerSuspendedScreen } from '@/components/seller/seller-suspended-screen';
import { getServerSession, hasAccessTokenCookie } from '@/lib/auth';
import { authTrace } from '@/lib/auth-trace';

export const metadata: Metadata = {
  title: {
    default: 'Seller Dashboard',
    template: '%s | Seller Dashboard | LocalKart',
  },
};

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasToken = hasAccessTokenCookie();
  const session = await getServerSession();

  if (!session) {
    if (!hasToken) {
      authTrace('seller-layout', { action: 'redirect-login', reason: 'no-token' });
      redirect('/login?intent=seller&redirect=/dashboard');
    }
    // Cookie present but profile could not be validated (transient API failure).
    // Defer to client AuthGuard instead of falsely redirecting a logged-in seller.
    authTrace('seller-layout', { action: 'defer-client', reason: 'session-unresolved' });
  } else if (session.user.role !== 'seller') {
    authTrace('seller-layout', { action: 'redirect-login', role: session.user.role });
    redirect('/login?intent=seller&redirect=/dashboard');
  } else {
    const hasShop = !!(session.user.shopId ?? session.user.shop?.id);
    if (!hasShop) {
      authTrace('seller-layout', { action: 'redirect-onboarding' });
      redirect('/seller-onboarding');
    }
  }

  const shopStatus = session?.user.shopStatus ?? session?.user.shop?.status;
  const shopName = session?.user.shopName ?? session?.user.shop?.name ?? undefined;
  const isSuspended = shopStatus === 'suspended';

  if (isSuspended) {
    authTrace('seller-layout', { action: 'suspended-screen', shopStatus });
    return (
      <div className="flex min-h-screen bg-muted/20">
        <SellerSuspendedScreen shopName={shopName} />
      </div>
    );
  }

  return (
    <SellerSuspendedGate>
      <div className="flex min-h-screen bg-muted/20">
        <SellerSidebar />
        <div className="flex flex-1 flex-col lg:pl-64">
          <SellerHeader />
          <main className="flex-1 p-4 pb-20 md:p-6 md:pb-8 lg:p-8">{children}</main>
        </div>
      </div>
    </SellerSuspendedGate>
  );
}
