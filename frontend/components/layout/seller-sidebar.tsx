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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/seller/dashboard' },
  { icon: Package, label: 'Products', href: '/seller/dashboard/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/seller/dashboard/orders' },
  { icon: TrendingUp, label: 'Ads', href: '/seller/dashboard/ads' },
  { icon: CreditCard, label: 'Subscription', href: '/seller/dashboard/subscription' },
  { icon: Settings, label: 'Settings', href: '/seller/dashboard/shop-settings' },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden border-r bg-card transition-all duration-300 lg:block',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex h-16 items-center border-b px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/seller/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="LocalKart" width={100} height={32} className="h-7 w-auto" />
          </Link>
        )}
        {collapsed && (
          <Store className="h-6 w-6 text-primary" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
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
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4" />

      {/* Back to Store */}
      <div className={cn('px-2', collapsed && 'flex justify-center')}>
        <Button variant="outline" asChild className={cn('w-full', collapsed && 'w-auto p-2')}>
          <Link href="/">
            <Store className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Back to Store</span>}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
