'use client';

import { useState, useEffect } from 'react';
import {
  Search, MapPin, ChevronRight, Bell,
  Zap, Shield, RefreshCw, ArrowRight,
  TrendingUp, Store, Sparkles, Star,
  Clock, Package, Play,
} from 'lucide-react';
import Link from 'next/link';
import { useLocationStore } from '@/store/location-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { NearbyShopsSection }    from '@/components/home/nearby-shops-section';
import { CategoriesSection }      from '@/components/home/categories-section';
import { TrendingProductsSection } from '@/components/home/trending-products-section';
import { TodayOffersSection }      from '@/components/home/today-offers-section';
import { HowItWorksSection }       from '@/components/home/how-it-works-section';
import { FounderSection }          from '@/components/home/founder-section';
import { LocationDialog }          from '@/components/location/location-dialog';

const BANNERS = [
  { gradient: 'linear-gradient(135deg,#3D5AF1 0%,#6D28D9 55%,#4338CA 100%)', glowColor: 'rgba(109,40,217,0.45)', badge: '🔥 Flash Sale', headline: 'Up to 70% OFF', sub: 'Fashion & Clothing', emoji: '👗', cta: 'Shop Fashion' },
  { gradient: 'linear-gradient(135deg,#0EA5E9 0%,#2563EB 55%,#1E40AF 100%)', glowColor: 'rgba(37,99,235,0.45)', badge: '✨ New Arrivals', headline: 'Latest Gadgets', sub: 'Electronics & Tech', emoji: '📱', cta: 'Explore Tech' },
  { gradient: 'linear-gradient(135deg,#059669 0%,#047857 55%,#065F46 100%)', glowColor: 'rgba(4,120,87,0.40)', badge: '🌿 Farm Fresh', headline: 'Daily Delivered', sub: 'Groceries & Veggies', emoji: '🥦', cta: 'Order Now' },
] as const;

const TRUST = [
  { icon: Zap,       label: 'Same Day', sub: 'Delivery', color: '#3D5AF1', bg: '#EEF0FE' },
  { icon: RefreshCw, label: 'Easy',     sub: 'Returns',  color: '#059669', bg: '#ECFDF5' },
  { icon: Shield,    label: 'Secure',   sub: 'Payments', color: '#FF6B35', bg: '#FFF3EE' },
] as const;

const TICKER = [
  '🚚 Free delivery on orders above ₹199',
  '⚡ 10,000+ products from local shops',
  '🌟 Same-day delivery in Kadapa',
  '💳 Secure payments · Easy returns',
];

export default function HomePage() {
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [searchFocused,      setSearchFocused]      = useState(false);
  const [activeBanner,       setActiveBanner]       = useState(0);
  const [bannerAnimating,    setBannerAnimating]    = useState(false);

  const { latitude, longitude, loading: locationLoading, error: locationError, detectLocation } = useGeolocation();
  const { location: savedLocation, setLocation } = useLocationStore();

  useEffect(() => {
    if (latitude && longitude && !savedLocation) {
      setLocation({ latitude, longitude, source: 'gps' });
    }
  }, [latitude, longitude, savedLocation, setLocation]);

  useEffect(() => {
    const t = setInterval(() => {
      setBannerAnimating(true);
      setTimeout(() => { setActiveBanner(p => (p + 1) % BANNERS.length); setBannerAnimating(false); }, 200);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) window.location.href = `/browse?q=${encodeURIComponent(searchQuery)}`;
  };

  const goToBanner = (i: number) => {
    setBannerAnimating(true);
    setTimeout(() => { setActiveBanner(i); setBannerAnimating(false); }, 200);
  };

  const banner = BANNERS[activeBanner];

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA', fontFamily: 'var(--font-sans,sans-serif)' }}>
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onDetectLocation={async () => { await detectLocation(); setShowLocationDialog(false); }}
        locationLoading={locationLoading}
        locationError={locationError}
      />

      {/* ── HEADER ── */}
      <header className="lg:hidden sticky top-0 z-50 glass border-b border-white/70 shadow-soft-sm">
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <button onClick={() => setShowLocationDialog(true)} className="flex items-center gap-2 group max-w-[70%]">
            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#EEF0FE' }}>
              <MapPin className="h-3.5 w-3.5" style={{ color: '#3D5AF1' }} />
            </span>
            <div className="text-left min-w-0">
              <p className="text-[10px] text-gray-400 font-semibold leading-none tracking-wide uppercase">Delivering to</p>
              <p className="text-sm font-bold text-gray-800 truncate leading-snug flex items-center gap-0.5 mt-0.5">
                {savedLocation ? 'Kadapa, Andhra Pradesh' : 'Set Location'}
                <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </p>
            </div>
          </button>
          <Link href="/orders" className="relative flex items-center justify-center w-9 h-9 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <Bell className="h-4.5 w-4.5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white bg-red-500" />
          </Link>
        </div>
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative flex items-center rounded-2xl bg-white border transition-all duration-300"
            style={{ borderColor: searchFocused ? 'rgba(61,90,241,0.35)' : '#E5E9F2', boxShadow: searchFocused ? '0 0 0 3px rgba(61,90,241,0.10),0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
            <Search className="absolute left-3.5 h-4 w-4 transition-colors duration-200" style={{ color: searchFocused ? '#3D5AF1' : '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search sarees, mobiles, groceries..."
              className="w-full pl-10 pr-12 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery
              ? <button type="submit" className="absolute right-2.5 flex items-center justify-center w-8 h-8 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)' }}><ArrowRight className="h-3.5 w-3.5" /></button>
              : <span className="absolute right-3.5 text-[10px] font-bold text-gray-300 tracking-wider">SEARCH</span>
            }
          </div>
        </form>
      </header>

      {/* ── TICKER ── */}
      <div className="overflow-hidden py-2 border-b border-white/60" style={{ background: 'linear-gradient(90deg,#EEF0FE,#F5F0FF,#EEF0FE)' }}>
        <div className="flex gap-8 animate-ticker whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="text-[11px] font-semibold text-indigo-700 flex-shrink-0">{t}</span>
          ))}
        </div>
      </div>

      {/* ── BANNER ── */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="relative overflow-hidden rounded-3xl p-6 min-h-[156px] transition-opacity duration-200"
          style={{ background: banner.gradient, boxShadow: `0 20px 60px -12px ${banner.glowColor},0 8px 24px -8px rgba(0,0,0,0.15)`, opacity: bannerAnimating ? 0 : 1 }}
        >
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)', filter: 'blur(40px)' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full mb-3">{banner.badge}</span>
              <p className="text-[2.125rem] font-black tracking-tight text-white leading-none" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>{banner.headline}</p>
              <p className="text-sm text-white/80 font-semibold mt-1.5">{banner.sub}</p>
              <Link href="/browse">
                <button className="mt-4 inline-flex items-center gap-1.5 bg-white text-gray-800 text-xs font-extrabold px-4 py-2.5 rounded-xl active:scale-[0.97] transition-all" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {banner.cta} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <span className="text-[5.5rem] select-none flex-shrink-0 animate-float" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))' }}>{banner.emoji}</span>
          </div>
          <div className="absolute bottom-3.5 left-6 flex items-center gap-1.5">
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => goToBanner(i)} className="rounded-full transition-all duration-300"
                style={{ width: i === activeBanner ? '20px' : '6px', height: '6px', background: i === activeBanner ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST BADGES ── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2.5">
        {TRUST.map(({ icon: Icon, label, sub, color, bg }, i) => (
          <div key={label} className="bg-white rounded-2xl p-3 flex items-center gap-2.5 border border-gray-100/80 animate-fade-up"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color }} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-gray-800 leading-tight">{label}</p>
              <p className="text-[10px] text-gray-400 font-semibold leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TODAY'S OFFERS ── */}
      <TodayOffersSection />

      {/* ── CATEGORIES ── */}
      <section className="pt-4 pb-1">
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#EEF0FE' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#3D5AF1' }} />
            </span>
            Shop by Category
          </h2>
          <Link href="/browse" className="section-link">See all <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
        <CategoriesSection />
      </section>

      {/* ── TRENDING ── */}
      <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#FFF3EE' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#FF6B35' }} />
            </span>
            Trending Now
          </h2>
          <Link href="/browse" className="section-link">See all <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
        <TrendingProductsSection />
      </section>

      {/* ── NEARBY SHOPS ── */}
      {savedLocation && (
        <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
          <div className="section-header">
            <h2 className="section-title flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#EEF0FE' }}>
                <Store className="h-4 w-4" style={{ color: '#3D5AF1' }} />
              </span>
              Shops Near You
            </h2>
            <Link href="/browse" className="section-link">See all <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
          <NearbyShopsSection latitude={savedLocation.latitude} longitude={savedLocation.longitude} />
        </section>
      )}

      {/* ── VIDEO REELS CTA ── */}
      <div className="px-4 mt-3">
        <Link href="/videos">
          <div
            className="relative overflow-hidden rounded-3xl p-5 flex items-center justify-between"
            style={{
              background:  'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
              boxShadow:   '0 8px 32px rgba(0,0,0,0.20)',
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
              style={{ background: '#FF6B35', filter: 'blur(30px)' }} />
            <div>
              <p className="text-[11px] font-bold text-orange-300 mb-1">🎬 New Feature</p>
              <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>
                Watch & Shop
              </p>
              <p className="text-xs text-white/50 mt-0.5">Product videos from local shops</p>
            </div>
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0"
              style={{ background: 'rgba(255,107,53,0.90)', boxShadow: '0 4px 16px rgba(255,107,53,0.40)' }}
            >
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
        </Link>
      </div>

      {/* ── SELL ON LOCALKART ── */}
      <div className="px-4 py-5 mt-3">
        <div className="relative overflow-hidden rounded-3xl p-6 noise-overlay"
          style={{ background: 'linear-gradient(135deg,#0A0918 0%,#15145A 50%,#1E0A4E 100%)', boxShadow: '0 24px 64px -12px rgba(61,90,241,0.40),0 8px 24px -8px rgba(0,0,0,0.30)' }}>
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full" style={{ background: '#3D5AF1', opacity: 0.18, filter: 'blur(48px)' }} />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full" style={{ background: '#FF6B35', opacity: 0.14, filter: 'blur(36px)' }} />
          <div className="absolute inset-0 opacity-[0.06] rounded-3xl" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 backdrop-blur-sm text-indigo-300 px-3 py-1 rounded-full mb-3 border border-white/10">
                <Star className="h-3 w-3 fill-current" /> For Local Businesses
              </span>
              <p className="text-2xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>
                Start Selling<br />
                <span style={{ background: 'linear-gradient(90deg,#818CF8,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  on LocalKart
                </span>
              </p>
              <p className="text-xs text-white/50 font-semibold mt-2">Reach 10,000+ local customers today</p>
              <Link href="/seller-onboarding">
                <button className="mt-4 inline-flex items-center gap-2 bg-white font-extrabold text-xs px-5 py-2.5 rounded-xl active:scale-[0.97] transition-all"
                  style={{ color: '#3D5AF1', boxShadow: '0 4px 20px rgba(255,255,255,0.20)' }}>
                  Start Selling Free <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <span className="text-6xl select-none flex-shrink-0 animate-float" style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))', animationDelay: '0.8s' }}>🏪</span>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
        <HowItWorksSection />
      </section>

      {/* ── FOUNDER ── */}
      <section className="mt-3 pt-4 pb-5">
        <FounderSection />
      </section>

      <div className="h-24" />
    </div>
  );
}

