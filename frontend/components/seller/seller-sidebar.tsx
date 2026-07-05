'use client';

import { Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sellerNavItems } from '@/lib/seller-nav';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="LocalKart" width={100} height={32} className="h-7 w-auto" />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Seller
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {sellerNavItems.map((item) => {
          const isBulkUpload = item.href === '/dashboard/products/bulk-upload';
          const isProducts = item.href === '/dashboard/products';
          const isHighlight = item.href === '/dashboard/staff';
          const isActive = isProducts
            ? pathname === item.href || (pathname.startsWith('/dashboard/products/') && !pathname.includes('bulk-upload'))
            : isBulkUpload
              ? pathname.startsWith(item.href)
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isHighlight
                    ? 'bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-0 right-0 px-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Store className="h-5 w-5 shrink-0" />
          <span>Back to Store</span>
        </Link>
      </div>
    </aside>
  );
}
