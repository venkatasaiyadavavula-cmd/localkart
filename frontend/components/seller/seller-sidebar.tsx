'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Settings,
  Store,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/seller/dashboard' },
  { icon: Package, label: 'Products', href: '/seller/dashboard/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/seller/dashboard/orders' },
  { icon: Zap, label: 'Today\'s Offers', href: '/seller/dashboard/offers' },
  { icon: TrendingUp, label: 'Ads', href: '/seller/dashboard/ads' },
  { icon: CreditCard, label: 'Subscription', href: '/seller/dashboard/subscription' },
  { icon: Settings, label: 'Settings', href: '/seller/dashboard/shop-settings' },
];

export function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/seller/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="LocalKart" width={100} height={32} className="h-7 w-auto" />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Seller
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
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
