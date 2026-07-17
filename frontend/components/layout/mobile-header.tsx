'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, MapPin, ChevronRight, User, ShoppingBag, Heart,
  LogOut, Package, Settings, Store, ArrowRight, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';
import { useLocationStore } from '@/store/location-store';
import { getLocationDisplayLabel } from '@/lib/geocode';
import { useTranslation } from '@/hooks/use-translation';
import { LocationDialog } from '@/components/location/location-dialog';
import { useGeolocation } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalItems } = useCartStore();
  const { location: savedLocation, setLocation, validateAndSetServiceability } = useLocationStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { latitude, longitude, loading: locationLoading, error: locationError, detectLocation } = useGeolocation();

  const locationLabel = getLocationDisplayLabel(savedLocation, t('setLocation'));

  useEffect(() => {
    if (latitude && longitude && !savedLocation) {
      setLocation({ latitude, longitude, source: 'gps' });
      validateAndSetServiceability(latitude, longitude);
    }
  }, [latitude, longitude, savedLocation, setLocation, validateAndSetServiceability]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const hideOnPages = pathname.startsWith('/orders/track');
  if (hideOnPages) return null;

  return (
    <>
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onDetectLocation={async () => { await detectLocation(); setShowLocationDialog(false); }}
        locationLoading={locationLoading}
        locationError={locationError}
      />

      <header className="lg:hidden sticky top-0 z-50 glass border-b border-white/70 shadow-soft-sm">
        {/* Row 1: location + profile / cart / wishlist */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowLocationDialog(true)}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-primary/10">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="text-left min-w-0">
              <p className="text-[10px] text-gray-400 font-semibold leading-none uppercase tracking-wide">
                {t('deliveringTo')}
              </p>
              <p className="text-sm font-bold text-gray-800 truncate leading-snug flex items-center gap-0.5 mt-0.5">
                {locationLabel}
                <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0" ref={menuRef}>
            <Link
              href="/wishlist"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-100 bg-white shadow-xs"
              aria-label={t('wishlist')}
            >
              <Heart className="h-4 w-4 text-gray-600" />
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-100 bg-white shadow-xs"
              aria-label={t('cart')}
            >
              <ShoppingBag className="h-4 w-4 text-gray-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(p => !p)}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl border transition-colors',
                  showProfileMenu ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-white shadow-xs',
                )}
                aria-label={t('profile')}
              >
                {user ? (
                  <span className="text-xs font-extrabold text-primary">
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-gray-600" />
                )}
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-52 py-2 rounded-2xl border border-gray-100 bg-white shadow-xl z-50"
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      {[
                        { href: '/profile', icon: User, label: t('myAccount') },
                        { href: '/orders', icon: Package, label: t('myOrders') },
                        { href: '/wishlist', icon: Heart, label: t('wishlist') },
                        { href: '/cart', icon: ShoppingBag, label: t('cart') },
                        { href: '/profile', icon: Settings, label: 'Settings' },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={`${href}-${label}`}
                          href={href}
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Icon className="h-4 w-4 text-gray-400" />
                          {label}
                        </Link>
                      ))}
                      {user.role === 'seller' && (
                        <Link
                          href="/dashboard"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5"
                        >
                          <Store className="h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 border-t border-gray-50 mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-2 space-y-1">
                      <Link
                        href="/login"
                        onClick={() => setShowProfileMenu(false)}
                        className="block w-full text-center text-sm font-bold text-primary py-2 rounded-xl hover:bg-primary/5"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setShowProfileMenu(false)}
                        className="block w-full text-center text-sm font-bold text-white py-2 rounded-xl"
                        style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)' }}
                      >
                        {t('signUpFree')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: centered search */}
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div
            className="relative flex items-center rounded-2xl bg-white border transition-all duration-300"
            style={{
              borderColor: searchFocused ? 'rgba(61,90,241,0.35)' : '#E5E9F2',
              boxShadow: searchFocused
                ? '0 0 0 3px rgba(61,90,241,0.10), 0 4px 16px rgba(0,0,0,0.06)'
                : '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Search
              className="absolute left-3.5 h-4 w-4 transition-colors duration-200"
              style={{ color: searchFocused ? '#3D5AF1' : '#9CA3AF' }}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-12 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none text-center sm:text-left"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-11 flex items-center justify-center w-6 h-6 rounded-lg hover:bg-gray-100"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            ) : null}
            <button
              type="submit"
              className="absolute right-2.5 flex items-center justify-center w-8 h-8 rounded-xl text-white"
              style={{ background: searchQuery ? 'linear-gradient(135deg,#3D5AF1,#6D28D9)' : '#EEF0FE' }}
            >
              <ArrowRight className="h-3.5 w-3.5" style={{ color: searchQuery ? '#fff' : '#3D5AF1' }} />
            </button>
          </div>
        </form>
      </header>
    </>
  );
}
