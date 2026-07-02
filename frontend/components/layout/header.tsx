'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingBag, User, LogOut,
  Package, Store, ChevronDown, Bell,
  MapPin, ArrowRight, Zap, Sparkles,
  Heart, Settings, X, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageToggle } from './language-toggle';
import { useLocationStore } from '@/lib/store/location-store';
import { getLocationDisplayLabel } from '@/lib/geocode';
import { buildLoginUrl, buildRegisterUrl, SELLER_ONBOARDING_PATH } from '@/lib/auth-routes';

const CATEGORIES = [
  { label: 'Groceries',   labelTe: 'కిరాణా',       slug: 'groceries',      emoji: '🛒', color: '#059669', bg: '#ECFDF5', hover: '#D1FAE5' },
  { label: 'Fashion',     labelTe: 'ఫ్యాషన్',       slug: 'fashion',         emoji: '👗', color: '#DB2777', bg: '#FDF2F8', hover: '#FCE7F3' },
  { label: 'Electronics', labelTe: 'ఎలక్ట్రానిక్స్', slug: 'electronics',     emoji: '📱', color: '#2563EB', bg: '#EFF6FF', hover: '#DBEAFE' },
  { label: 'Beauty',      labelTe: 'బ్యూటీ',        slug: 'beauty',          emoji: '💄', color: '#7C3AED', bg: '#F5F3FF', hover: '#EDE9FE' },
  { label: 'Home',        labelTe: 'హోమ్',          slug: 'home_essentials', emoji: '🏠', color: '#D97706', bg: '#FFFBEB', hover: '#FEF3C7' },
  { label: 'Accessories', labelTe: 'యాక్సెసరీస్',    slug: 'accessories',     emoji: '⌚', color: '#0891B2', bg: '#ECFEFF', hover: '#CFFAFE' },
] as const;

/* quick-search suggestions */
const SUGGESTIONS = [
  '🛒 Fresh vegetables',
  '👗 Casual t-shirts',
  '📱 Samsung mobiles',
  '💄 Skincare combo',
  '🏠 LED bulbs',
];

function Dropdown({ children, open, align = 'left' }: {
  children: React.ReactNode;
  open: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className="absolute top-[calc(100%+10px)] z-50 transition-all duration-200 origin-top"
      style={{
        [align === 'right' ? 'right' : 'left']: 0,
        opacity:       open ? 1 : 0,
        transform:     open ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-8px)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}

function IconBtn({
  href, onClick, title, badge, children,
}: {
  href?: string;
  onClick?: () => void;
  title?: string;
  badge?: number | boolean;
  children: React.ReactNode;
}) {
  const cls =
    'relative flex items-center justify-center w-10 h-10 rounded-2xl border transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 group';
  const style = {
    background:   'white',
    borderColor:  '#E5E9F2',
    boxShadow:    '0 1px 4px rgba(0,0,0,0.05)',
  };
  const content = (
    <>
      {children}
      {badge && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full border-2 border-white text-[9px] font-extrabold text-white"
          style={{
            background: 'linear-gradient(135deg,#EF4444,#DC2626)',
            boxShadow:  '0 2px 8px rgba(239,68,68,0.40)',
          }}
        >
          {typeof badge === 'number' ? (badge > 99 ? '99+' : badge) : ''}
        </span>
      )}
    </>
  );
  if (href) return <Link href={href} title={title} className={cls} style={style}>{content}</Link>;
  return <button onClick={onClick} title={title} className={cls} style={style}>{content}</button>;
}

/* ═════════════════════════════════════════════════════════════
   MAIN HEADER
═════════════════════════════════════════════════════════════ */
export function Header() {
  const pathname       = usePathname();
  const router         = useRouter();
  const { user, logout } = useAuth();
  const { totalItems }   = useCartStore();
  const { t, language }  = useTranslation();
  const { location: savedLocation } = useLocationStore();
  const locationLabel = getLocationDisplayLabel(savedLocation, t('setLocation'));

  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [showSuggestions,setShowSuggestions]= useState(false);
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  /* close on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowCategories(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* Keyboard shortcut: Cmd/Ctrl+K → focus search */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const closeAll = () => {
    setShowUserMenu(false);
    setShowCategories(false);
    setShowSuggestions(false);
  };

  return (
    <header className="hidden lg:block sticky top-0 z-40">

      {/* ══════════════════════════════════════
          ANNOUNCEMENT BAR
      ══════════════════════════════════════ */}
      <div style={{
        background:   'linear-gradient(90deg,#0F0E2A 0%,#1a1560 50%,#0F0E2A 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">

          {/* Location */}
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center w-5 h-5 rounded-md"
              style={{ background: 'rgba(129,140,248,0.15)' }}
            >
              <MapPin className="h-3 w-3" style={{ color: '#818CF8' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'rgba(199,210,254,0.75)' }}>
              {t('deliveringTo')}&nbsp;
              <span className="text-white font-bold">{locationLabel}</span>
            </span>
          </div>

          {/* Centre — promos */}
          <div className="flex items-center gap-5 text-xs font-semibold" style={{ color: 'rgba(165,180,252,0.65)' }}>
            <span className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors cursor-default">
              <Zap className="h-3 w-3" style={{ color: '#A78BFA' }} />
              {t('freeDelivery')}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>|</span>
            <span className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors cursor-default">
              <Sparkles className="h-3 w-3" style={{ color: '#FCD34D' }} />
              {t('sameDayDelivery')}
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <LanguageToggle className="!bg-transparent !border-white/10 !text-white/70 hover:!border-white/30" />
            <Link
              href={buildLoginUrl({ intent: 'seller', redirect: SELLER_ONBOARDING_PATH })}
              className="flex items-center gap-1 text-xs font-bold transition-all duration-200 group"
              style={{ color: 'rgba(165,180,252,0.70)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(165,180,252,0.70)')}
            >
              {t('sellOnLocalKart')}
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN NAV ROW
      ══════════════════════════════════════ */}
      <div
        className="glass border-b relative z-20"
        style={{ borderColor: 'rgba(226,232,240,0.80)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4" ref={wrapperRef}>

          {/* ── Logo ── */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group" onClick={closeAll}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-4deg]"
              style={{
                background: 'linear-gradient(135deg,#3D5AF1 0%,#6D28D9 100%)',
                boxShadow:  '0 4px 16px rgba(61,90,241,0.35)',
              }}
            >
              <span className="text-lg leading-none select-none">🛒</span>
            </div>
            <div className="leading-none select-none">
              <p
                className="text-[1.3rem] font-black tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-display, Syne, sans-serif)' }}
              >
                <span style={{ color: '#3D5AF1' }}>Local</span>
                <span style={{ color: '#FF6B35' }}>Kart</span>
              </p>
              <p
                className="text-[9px] font-extrabold tracking-[0.18em] uppercase mt-0.5"
                style={{ color: '#C4C9D4' }}
              >
                Shop Local
              </p>
            </div>
          </Link>

          {/* ── Categories dropdown trigger ── */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setShowCategories(p => !p); setShowUserMenu(false); setShowSuggestions(false); }}
              className="flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-xl transition-all duration-200"
              style={{
                color:      showCategories ? '#3D5AF1'         : '#4B5563',
                background: showCategories ? '#EEF0FE'         : 'transparent',
                border:     `1.5px solid ${showCategories ? 'rgba(61,90,241,0.25)' : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!showCategories) { e.currentTarget.style.background = '#F8F9FC'; e.currentTarget.style.color = '#1F2937'; } }}
              onMouseLeave={e => { if (!showCategories) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5563'; } }}
            >
              <span className="text-base leading-none">🗂️</span>
              {t('allCategories')}
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform duration-200"
                style={{ transform: showCategories ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Categories dropdown panel */}
            <Dropdown open={showCategories}>
              <div
                className="w-[300px] py-3 overflow-hidden"
                style={{
                  background:   'white',
                  borderRadius: '22px',
                  border:       '1px solid rgba(226,232,240,0.80)',
                  boxShadow:    '0 24px 64px -12px rgba(0,0,0,0.16), 0 8px 24px -8px rgba(0,0,0,0.08)',
                }}
              >
                {/* Header */}
                <div className="px-4 pb-2.5 flex items-center justify-between">
                  <p className="text-[10px] font-extrabold tracking-[0.14em] uppercase" style={{ color: '#9CA3AF' }}>
                    {t('shopByCategory')}
                  </p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#EEF0FE', color: '#3D5AF1' }}
                  >
                    {CATEGORIES.length}
                  </span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-0.5 px-2">
                  {CATEGORIES.map(cat => (
                    <Link
                      key={cat.slug}
                      href={`/browse/${cat.slug}`}
                      onClick={closeAll}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 group"
                      style={{ color: '#374151' }}
                      onMouseEnter={e => { e.currentTarget.style.background = cat.hover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-base transition-transform duration-200 group-hover:scale-110"
                        style={{ background: cat.bg }}
                      >
                        {cat.emoji}
                      </span>
                      <span className="text-xs font-bold truncate" style={{ color: cat.color }}>
                        {language === 'te' ? cat.labelTe : cat.label}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Footer CTA */}
                <div className="mx-4 mt-2.5 pt-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <Link
                    href="/browse"
                    onClick={closeAll}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group"
                    style={{ background: '#F8F9FF' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EEF0FE'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FF'; }}
                  >
                    <span className="text-xs font-extrabold" style={{ color: '#3D5AF1' }}>
                      {t('seeAll')}
                    </span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: '#3D5AF1' }}
                    />
                  </Link>
                </div>
              </div>
            </Dropdown>
          </div>

          {/* ── Search bar ── */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
            <div
              className="relative flex items-center rounded-2xl bg-white transition-all duration-300"
              style={{
                border:    `1.5px solid ${searchFocused ? 'rgba(61,90,241,0.40)' : '#E5E9F2'}`,
                boxShadow: searchFocused
                  ? '0 0 0 3px rgba(61,90,241,0.10), 0 4px 24px rgba(0,0,0,0.08)'
                  : '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <Search
                className="absolute left-4 h-4 w-4 pointer-events-none transition-colors duration-200"
                style={{ color: searchFocused ? '#3D5AF1' : '#9CA3AF' }}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full pl-11 pr-24 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocused(true); setShowSuggestions(true); setShowCategories(false); setShowUserMenu(false); }}
                onBlur={() => { setSearchFocused(false); setTimeout(() => setShowSuggestions(false), 150); }}
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-gray-100"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center justify-center h-8 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95"
                  style={{
                    background: searchQuery
                      ? 'linear-gradient(135deg,#3D5AF1,#6D28D9)'
                      : '#F1F5F9',
                    color:     searchQuery ? 'white' : '#9CA3AF',
                    boxShadow: searchQuery ? '0 2px 12px rgba(61,90,241,0.35)' : 'none',
                  }}
                >
                  {searchQuery ? <ArrowRight className="h-3.5 w-3.5" /> : (
                    <kbd className="text-[10px] font-bold tracking-wider">⌘K</kbd>
                  )}
                </button>
              </div>
            </div>

            {/* Quick suggestions dropdown */}
            {showSuggestions && !searchQuery && (
              <div
                className="absolute top-[calc(100%+8px)] left-0 right-0 py-2 animate-scale-in"
                style={{
                  background:   'white',
                  borderRadius: '18px',
                  border:       '1px solid rgba(226,232,240,0.80)',
                  boxShadow:    '0 20px 60px -12px rgba(0,0,0,0.14), 0 4px 16px -4px rgba(0,0,0,0.06)',
                  zIndex:       50,
                }}
              >
                <p className="px-4 pb-1.5 text-[10px] font-extrabold tracking-[0.13em] uppercase" style={{ color: '#9CA3AF' }}>
                  Popular searches
                </p>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => {
                      const q = s.replace(/^.*? /, '');
                      router.push(`/browse?q=${encodeURIComponent(q)}`);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left font-medium text-gray-700 transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* ── Right icon cluster ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">

            <IconBtn href="/wishlist" title={t('wishlist')}>
              <Heart className="h-[18px] w-[18px] text-gray-500 group-hover:text-pink-500 transition-colors" />
            </IconBtn>

            <IconBtn href="/orders" title="Notifications" badge={true}>
              <Bell className="h-[18px] w-[18px] text-gray-500 group-hover:text-primary transition-colors" />
            </IconBtn>

            <IconBtn href="/cart" title={t('cart')} badge={totalItems || undefined}>
              <ShoppingBag className="h-[18px] w-[18px] text-gray-500 group-hover:text-primary transition-colors" />
            </IconBtn>

            {/* ── User menu ── */}
            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => { setShowUserMenu(p => !p); setShowCategories(false); setShowSuggestions(false); }}
                  className="flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-2xl border transition-all duration-200"
                  style={{
                    background:  showUserMenu ? '#EEF0FE' : 'white',
                    borderColor: showUserMenu ? 'rgba(61,90,241,0.30)' : '#E5E9F2',
                    boxShadow:   '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={e => { if (!showUserMenu) { e.currentTarget.style.borderColor = 'rgba(61,90,241,0.20)'; } }}
                  onMouseLeave={e => { if (!showUserMenu) { e.currentTarget.style.borderColor = '#E5E9F2'; } }}
                >
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)' }}
                  >
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-gray-800">{user.name?.split(' ')[0]}</p>
                    <p className="text-[10px] font-semibold capitalize mt-0.5" style={{ color: '#9CA3AF' }}>{user.role}</p>
                  </div>
                  <ChevronDown
                    className="h-3.5 w-3.5 ml-0.5 transition-transform duration-200"
                    style={{ color: '#9CA3AF', transform: showUserMenu ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                <Dropdown open={showUserMenu} align="right">
                  <div
                    className="w-60 py-2"
                    style={{
                      background:   'white',
                      borderRadius: '20px',
                      border:       '1px solid rgba(226,232,240,0.80)',
                      boxShadow:    '0 24px 64px -12px rgba(0,0,0,0.16), 0 8px 24px -8px rgba(0,0,0,0.08)',
                    }}
                  >
                    {/* User header */}
                    <div
                      className="mx-3 mb-1.5 p-3 rounded-xl flex items-center gap-3"
                      style={{ background: 'linear-gradient(135deg,#EEF0FE,#F0EEFF)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 12px rgba(61,90,241,0.30)' }}
                      >
                        {user.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="py-1">
                      {[
                        { href: '/profile',  icon: User,     label: t('myAccount') },
                        { href: '/orders',   icon: Package,  label: t('myOrders') },
                        { href: '/wishlist', icon: Heart,    label: t('wishlist') },
                        { href: '/profile', icon: Settings, label: 'Settings' },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeAll}
                          className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
                          onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Icon className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                          {label}
                        </Link>
                      ))}

                      {user.role === 'seller' && (
                        <Link
                          href="/dashboard"
                          onClick={closeAll}
                          className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors"
                          style={{ color: '#3D5AF1' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#EEF0FE')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Store className="h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="mx-2 pt-1" style={{ borderTop: '1px solid #F1F5F9' }}>
                      <button
                        onClick={() => { logout(); closeAll(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors mt-1"
                        style={{ color: '#EF4444' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href={buildLoginUrl({ intent: 'customer' })}>
                  <button
                    className="text-sm font-bold px-4 py-2 rounded-xl border transition-all duration-200"
                    style={{ color: '#3D5AF1', borderColor: 'rgba(61,90,241,0.25)', background: 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF0FE')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    {t('login')}
                  </button>
                </Link>
                <Link href={buildRegisterUrl({ intent: 'customer' })}>
                  <button
                    className="text-sm font-extrabold text-white px-5 py-2 rounded-xl transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)',
                      boxShadow:  '0 4px 16px rgba(61,90,241,0.35)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(61,90,241,0.45)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(61,90,241,0.35)')}
                  >
                    {t('signUpFree')}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CATEGORY NAV STRIP
      ══════════════════════════════════════ */}
      <div
        className="glass border-b relative z-10"
        style={{ borderColor: 'rgba(226,232,240,0.55)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-0.5 h-11">
          {CATEGORIES.map(cat => {
            const active = pathname.includes(cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/browse/${cat.slug}`}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 h-8 group whitespace-nowrap"
                style={{
                  color:      active ? cat.color : '#6B7280',
                  background: active ? cat.bg    : 'transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = cat.bg; e.currentTarget.style.color = cat.color; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}
              >
                <span className="text-sm leading-none">{cat.emoji}</span>
                {language === 'te' ? cat.labelTe : cat.label}
                {active && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full"
                    style={{ background: cat.color }}
                  />
                )}
              </Link>
            );
          })}

          {/* Deals pill — pinned right */}
          <Link
            href="/browse?sale=true"
            className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg,#FFF3EE,#FFEDD5)',
              color:      '#EA580C',
              border:     '1.5px solid rgba(234,88,12,0.15)',
              boxShadow:  '0 2px 8px rgba(234,88,12,0.10)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(234,88,12,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(234,88,12,0.10)')}
          >
            🔥 {t('todaysDeals')}
          </Link>
        </div>
      </div>
    </header>
  );
}
