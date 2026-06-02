'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingBag, User, LogOut,
  Package, Store, ChevronDown, Bell, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';

const categories = [
  { label: 'Groceries', slug: 'groceries', emoji: '🛒' },
  { label: 'Fashion', slug: 'fashion', emoji: '👗' },
  { label: 'Electronics', slug: 'electronics', emoji: '📱' },
  { label: 'Beauty', slug: 'beauty', emoji: '💄' },
  { label: 'Home', slug: 'home_essentials', emoji: '🏠' },
  { label: 'Accessories', slug: 'accessories', emoji: '⌚' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowCategories(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <MapPin className="h-3 w-3" />
            <span>Delivering to Kadapa, Andhra Pradesh</span>
          </div>
          <div className="flex items-center gap-4 text-white/80 text-xs">
            <span>Free delivery on orders above ₹199</span>
            <span>|</span>
            <span>Same day delivery available</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-1">
          <span className="text-2xl font-black">
            <span className="text-primary">Local</span>
            <span className="text-orange-500">Kart</span>
          </span>
        </Link>

        {/* Categories dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            All Categories
            <ChevronDown className={cn('h-4 w-4 transition-transform', showCategories && 'rotate-180')} />
          </button>

          {showCategories && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border z-50 w-56 py-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/browse/${cat.slug}`}
                  onClick={() => setShowCategories(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for products, brands, shops..."
              className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notifications */}
          <Link href="/orders" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ShoppingBag className="h-5 w-5 text-gray-600" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link href="/orders" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Package className="h-5 w-5 text-gray-600" />
          </Link>

          {/* User menu */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-3 pr-2 py-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{user.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
                </div>
                <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', showUserMenu && 'rotate-180')} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border z-50 w-52 py-2">
                  <Link href="/profile" onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                    <User className="h-4 w-4" /> My Profile
                  </Link>
                  <Link href="/orders" onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                  {user.role === 'seller' && (
                    <Link href="/dashboard" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                      <Store className="h-4 w-4" /> Seller Dashboard
                    </Link>
                  )}
                  <div className="border-t my-1" />
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="text-sm font-semibold text-primary border border-primary px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="text-sm font-semibold text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Category nav bar */}
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-10">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse/${cat.slug}`}
              className={cn(
                'text-xs font-medium transition-colors hover:text-primary flex items-center gap-1.5 h-full border-b-2',
                pathname.includes(cat.slug) ? 'text-primary border-primary' : 'text-gray-500 border-transparent'
              )}
            >
              <span>{cat.emoji}</span> {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
