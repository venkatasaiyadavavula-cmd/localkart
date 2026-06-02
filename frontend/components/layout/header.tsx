'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, LogOut, Package, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-2xl font-black text-primary">Local<span className="text-orange-500">Kart</span></span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, shops..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Nav links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          {['Groceries', 'Fashion', 'Electronics', 'Beauty', 'Home'].map((cat) => (
            <Link
              key={cat}
              href={`/browse/${cat.toLowerCase()}`}
              className={cn('hover:text-primary transition-colors', pathname.includes(cat.toLowerCase()) && 'text-primary')}
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4 ml-auto flex-shrink-0">
          {/* Cart */}
          <Link href="/cart" className="relative">
            <ShoppingBag className="h-6 w-6 text-gray-600 hover:text-primary transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link href="/orders">
            <Package className="h-6 w-6 text-gray-600 hover:text-primary transition-colors" />
          </Link>

          {/* Profile / Login */}
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'seller' && (
                <Link href="/dashboard" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                  <Store className="h-4 w-4" /> Dashboard
                </Link>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800 leading-tight">{user.name?.split(' ')[0]}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
