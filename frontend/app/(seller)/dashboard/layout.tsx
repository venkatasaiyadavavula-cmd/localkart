import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SellerHeader } from '@/components/seller/seller-header';
import { SellerSidebar } from '@/components/seller/seller-sidebar';
import { getServerSession } from '@/lib/auth';

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
  const session = await getServerSession();

  if (!session || session.user.role !== 'seller') {
    redirect('/login?redirect=/dashboard');
  }

  const hasShop = !!(session.user.shopId ?? (session.user as { shop?: { id?: string } }).shop?.id);

  if (!hasShop) {
    redirect('/seller-onboarding');
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <SellerSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <SellerHeader />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-8 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
