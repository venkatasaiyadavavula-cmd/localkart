'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Zap,
  TrendingUp, IndianRupee, Users, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/products', icon: Package, label: 'Products' },
  { href: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/dashboard/offers', icon: Zap, label: 'Offers' },
  { href: '/dashboard/ads', icon: TrendingUp, label: 'Ads' },
  { href: '/dashboard/commission', icon: IndianRupee, label: 'Bills' },
  { href: '/dashboard/staff', icon: Users, label: 'Staff' },
  { href: '/dashboard/shop-settings', icon: Settings, label: 'Settings' },
];

export function SellerMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden border-b bg-background overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max px-2 py-2 gap-1">
        {items.map((item) => {
          const isProducts = item.href === '/dashboard/products';
          const isActive = isProducts
            ? pathname === item.href || (pathname.startsWith('/dashboard/products/') && !pathname.includes('bulk-upload'))
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold min-w-[56px]',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
