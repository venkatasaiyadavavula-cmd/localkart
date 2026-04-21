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

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.user.role !== 'seller') {
    redirect('/login?redirect=/seller/dashboard');
  }

  // Check if seller has a shop
  const hasShop = session.user.shopId !== null;

  if (!hasShop) {
    redirect('/seller-onboarding');
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <SellerSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <SellerHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
