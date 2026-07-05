'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Zap, Play, Navigation, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { buildLoginUrl } from '@/lib/auth-routes';

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, label: t('home'), href: '/', exact: true },
    { icon: Zap, label: t('dailyOffers'), href: '/browse?sale=true', matchSale: true },
    { icon: Play, label: t('videos'), href: '/videos' },
    { icon: Navigation, label: t('liveTracking'), href: '/orders?live=1', matchLive: true },
    { icon: Package, label: t('orders'), href: '/orders', matchOrders: true },
  ];

  const isActive = (item: typeof navItems[number]) => {
    if (item.exact) return pathname === '/';
    if (item.matchSale) return pathname === '/browse' && searchParams.get('sale') === 'true';
    if (item.matchLive) return pathname === '/orders' && searchParams.get('live') === '1';
    if (item.matchOrders) return pathname === '/orders' && searchParams.get('live') !== '1';
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}

              <div className="relative">
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  active ? 'bg-primary/10' : 'group-active:bg-gray-100',
                )}>
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      active ? 'text-primary' : 'text-gray-400',
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
              </div>

              <span className={cn(
                'text-[9px] font-medium leading-none transition-colors text-center px-0.5',
                active ? 'text-primary' : 'text-gray-400',
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="h-safe-bottom bg-white" />
    </nav>
  );
}
