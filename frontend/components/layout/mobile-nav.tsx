'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';

export function MobileNav() {
  const pathname = usePathname();
  const { totalItems } = useCartStore();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Browse', href: '/browse' },
    { icon: ShoppingBag, label: 'Cart', href: '/cart', badge: totalItems },
    { icon: Package, label: 'Orders', href: '/orders' },
    { icon: User, label: user ? 'Profile' : 'Login', href: user ? '/profile' : '/login' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
            >
              <div className="relative">
                <item.icon
                  className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-gray-400')}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive ? 'text-primary' : 'text-gray-400')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
