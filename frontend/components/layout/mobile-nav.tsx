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
    {
      icon: Home,
      label: 'Home',
      href: '/',
      exact: true,
    },
    {
      icon: Search,
      label: 'Browse',
      href: '/browse',
    },
    {
      icon: ShoppingBag,
      label: 'Cart',
      href: '/cart',
      badge: totalItems,
    },
    {
      icon: Package,
      label: 'Orders',
      href: '/orders',
    },
    {
      icon: User,
      label: user ? 'Profile' : 'Login',
      href: user ? '/profile' : '/login',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}

              <div className="relative">
                {/* Icon container */}
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary/10' : 'group-active:bg-gray-100'
                )}>
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive ? 'text-primary' : 'text-gray-400'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-1.5 -top-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors',
                isActive ? 'text-primary' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* iOS safe area */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  );
}
