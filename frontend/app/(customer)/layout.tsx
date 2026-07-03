import { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

export const metadata: Metadata = {
  title: {
    default: 'Shop Local - LocalKart',
    template: '%s | LocalKart',
  },
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MobileHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
