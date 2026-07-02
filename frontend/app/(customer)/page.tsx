'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, ChevronRight,
  Zap, Banknote, RefreshCw, ArrowRight,
  TrendingUp, Store, Sparkles, Star,
  Clock, Play,
} from 'lucide-react';
import Link from 'next/link';
import { useLocationStore } from '@/lib/store/location-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { reverseGeocode, getLocationDisplayLabel } from '@/lib/geocode';
import { NearbyShopsSection } from '@/components/home/nearby-shops-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { TrendingProductsSection } from '@/components/home/trending-products-section';
import { TodayOffersSection } from '@/components/home/today-offers-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { FounderSection } from '@/components/home/founder-section';
import { LocationDialog } from '@/components/location/location-dialog';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { useTranslation } from '@/hooks/use-translation';
import { buildLoginUrl, buildRegisterUrl, SELLER_ONBOARDING_PATH } from '@/lib/auth-routes';

const BANNERS = [
  { gradient: 'linear-gradient(135deg,#3D5AF1 0%,#6D28D9 55%,#4338CA 100%)', glowColor: 'rgba(109,40,217,0.45)', badge: '🔥 Flash Sale', headline: 'Up to 70% OFF', sub: 'Fashion & Clothing', emoji: '👗', cta: 'Shop Fashion' },
  { gradient: 'linear-gradient(135deg,#0EA5E9 0%,#2563EB 55%,#1E40AF 100%)', glowColor: 'rgba(37,99,235,0.45)', badge: '✨ New Arrivals', headline: 'Latest Gadgets', sub: 'Electronics & Tech', emoji: '📱', cta: 'Explore Tech' },
  { gradient: 'linear-gradient(135deg,#059669 0%,#047857 55%,#065F46 100%)', glowColor: 'rgba(4,120,87,0.40)', badge: '🌿 Farm Fresh', headline: 'Daily Delivered', sub: 'Groceries & Veggies', emoji: '🥦', cta: 'Order Now' },
] as const;

export default function HomePage() {
  const { t } = useTranslation();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [bannerAnimating, setBannerAnimating] = useState(false);

  const { latitude, longitude, loading: locationLoading, error: locationError, detectLocation } = useGeolocation();
  const { location: savedLocation, setLocation } = useLocationStore();

  const trustBadges = useMemo(() => [
    { icon: Zap, label: t('homeTrustSameDay'), sub: t('homeTrustSameDaySub'), color: '#3D5AF1', bg: '#EEF0FE' },
    { icon: RefreshCw, label: t('homeTrustReturns'), sub: t('homeTrustReturnsSub'), color: '#059669', bg: '#ECFDF5' },
    { icon: Banknote, label: t('homeTrustCod'), sub: t('homeTrustCodSub'), color: '#FF6B35', bg: '#FFF3EE' },
  ], [t]);

  const ticker = useMemo(() => [
    t('homeTickerFreeDelivery'),
    t('homeTickerProducts'),
    t('homeTickerSameDay'),
    t('homeTickerCod'),
  ], [t]);

  const locationLabel = getLocationDisplayLabel(savedLocation, t('setLocation'));

  useEffect(() => {
    if (!latitude || !longitude || savedLocation) return;

    reverseGeocode(latitude, longitude).then((geo) => {
      setLocation({
        latitude,
        longitude,
        source: 'gps',
        city: geo.city,
        state: geo.state,
        pincode: geo.pincode,
        address: geo.address,
      });
    });
  }, [latitude, longitude, savedLocation, setLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerAnimating(true);
      setTimeout(() => {
        setActiveBanner((p) => (p + 1) % BANNERS.length);
        setBannerAnimating(false);
      }, 200);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const goToBanner = (i: number) => {
    setBannerAnimating(true);
    setTimeout(() => {
      setActiveBanner(i);
      setBannerAnimating(false);
    }, 200);
  };

  const banner = BANNERS[activeBanner];

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA', fontFamily: 'var(--font-sans,sans-serif)' }}>
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onDetectLocation={async () => {
          await detectLocation();
          setShowLocationDialog(false);
        }}
        locationLoading={locationLoading}
        locationError={locationError}
      />

      <header className="lg:hidden sticky top-0 z-50 glass border-b border-white/70 shadow-soft-sm">
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between gap-2">
          <button onClick={() => setShowLocationDialog(true)} className="flex items-center gap-2 group min-w-0 flex-1">
            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#EEF0FE' }}>
              <MapPin className="h-3.5 w-3.5" style={{ color: '#3D5AF1' }} />
            </span>
            <div className="text-left min-w-0">
              <p className="text-[10px] text-gray-400 font-semibold leading-none tracking-wide uppercase">{t('deliveringTo')}</p>
              <p className="text-sm font-bold text-gray-800 truncate leading-snug flex items-center gap-0.5 mt-0.5">
                {locationLabel}
                <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </p>
            </div>
          </button>
          <LanguageToggle />
        </div>
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div
            className="relative flex items-center rounded-2xl bg-white border transition-all duration-300"
            style={{
              borderColor: searchFocused ? 'rgba(61,90,241,0.35)' : '#E5E9F2',
              boxShadow: searchFocused
                ? '0 0 0 3px rgba(61,90,241,0.10),0 4px 16px rgba(0,0,0,0.06)'
                : '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Search className="absolute left-3.5 h-4 w-4 transition-colors duration-200" style={{ color: searchFocused ? '#3D5AF1' : '#9CA3AF' }} />
            <input
              type="text"
              placeholder={t('homeSearchPlaceholder')}
              className="w-full pl-10 pr-12 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery ? (
              <button type="submit" className="absolute right-2.5 flex items-center justify-center w-8 h-8 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)' }}>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="absolute right-3.5 text-[10px] font-bold text-gray-300 tracking-wider">{t('homeSearchLabel')}</span>
            )}
          </div>
        </form>
      </header>

      <div className="overflow-hidden py-2 border-b border-white/60" style={{ background: 'linear-gradient(90deg,#EEF0FE,#F5F0FF,#EEF0FE)' }}>
        <div className="flex gap-8 animate-ticker whitespace-nowrap">
          {[...ticker, ...ticker].map((item, i) => (
            <span key={i} className="text-[11px] font-semibold text-indigo-700 flex-shrink-0">{item}</span>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div
          className="relative overflow-hidden rounded-3xl p-6 min-h-[156px] transition-opacity duration-200"
          style={{
            background: banner.gradient,
            boxShadow: `0 20px 60px -12px ${banner.glowColor},0 8px 24px -8px rgba(0,0,0,0.15)`,
            opacity: bannerAnimating ? 0 : 1,
          }}
        >
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full mb-3">{banner.badge}</span>
              <p className="text-[2.125rem] font-black tracking-tight text-white leading-none" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>{banner.headline}</p>
              <p className="text-sm text-white/80 font-semibold mt-1.5">{banner.sub}</p>
              <Link href="/browse">
                <button className="mt-4 inline-flex items-center gap-1.5 bg-white text-gray-800 text-xs font-extrabold px-4 py-2.5 rounded-xl active:scale-[0.97] transition-all" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {banner.cta} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <span className="text-[5.5rem] select-none flex-shrink-0 animate-float">{banner.emoji}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-3 gap-2.5">
        {trustBadges.map(({ icon: Icon, label, sub, color, bg }, i) => (
          <div key={label} className="bg-white rounded-2xl p-3 flex items-center gap-2.5 border border-gray-100/80 animate-fade-up" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', animationDelay: `${i * 80}ms` }}>
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

      {savedLocation && (
        <section className="mt-1 pt-4 pb-5 bg-white border-y border-gray-100/80">
          <div className="section-header">
            <h2 className="section-title flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#FFF3EE' }}>
                <Clock className="h-4 w-4" style={{ color: '#FF6B35' }} />
              </span>
              {t('homeTodaysOffers')}
            </h2>
            <Link href="/browse?sale=true" className="section-link">{t('seeAll')} <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
          <TodayOffersSection />
        </section>
      )}

      <section className="pt-4 pb-1">
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#EEF0FE' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#3D5AF1' }} />
            </span>
            {t('shopByCategory')}
          </h2>
          <Link href="/browse" className="section-link">{t('seeAll')} <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
        <CategoriesSection />
      </section>

      <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
        <div className="section-header">
          <h2 className="section-title flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#FFF3EE' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#FF6B35' }} />
            </span>
            {t('homeTrendingNow')}
          </h2>
          <Link href="/browse" className="section-link">{t('seeAll')} <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
        <TrendingProductsSection />
      </section>

      {savedLocation && (
        <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
          <div className="section-header">
            <h2 className="section-title flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: '#EEF0FE' }}>
                <Store className="h-4 w-4" style={{ color: '#3D5AF1' }} />
              </span>
              {t('homeShopsNearYou')}
            </h2>
            <Link href="/browse" className="section-link">{t('seeAll')} <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
          <NearbyShopsSection latitude={savedLocation.latitude} longitude={savedLocation.longitude} />
        </section>
      )}

      <div className="px-4 mt-3">
        <Link href="/videos">
          <div className="relative overflow-hidden rounded-3xl p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.20)' }}>
            <div>
              <p className="text-[11px] font-bold text-orange-300 mb-1">{t('homeNewFeature')}</p>
              <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>{t('homeWatchAndShop')}</p>
              <p className="text-xs text-white/50 mt-0.5">{t('homeWatchAndShopSub')}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0" style={{ background: 'rgba(255,107,53,0.90)' }}>
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 py-5 mt-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href={buildRegisterUrl({ intent: 'customer' })}>
            <div className="relative overflow-hidden rounded-3xl p-5 h-full" style={{ background: 'linear-gradient(135deg,#EEF0FE 0%,#FFFFFF 100%)', border: '1px solid rgba(61,90,241,0.12)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">{t('homeForShoppers')}</p>
              <p className="text-lg font-black text-gray-900" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>{t('homeBecomeCustomer')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('homeBecomeCustomerSub')}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600">{t('homeCreateFreeAccount')} <ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
          </Link>
          <Link href={buildRegisterUrl({ intent: 'seller', redirect: SELLER_ONBOARDING_PATH })}>
            <div className="relative overflow-hidden rounded-3xl p-5 h-full" style={{ background: 'linear-gradient(135deg,#F5F3FF 0%,#FFF7ED 100%)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-2">{t('homeForBusinesses')}</p>
              <p className="text-lg font-black text-gray-900" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>{t('homeBecomeSeller')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('homeBecomeSellerSub')}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-violet-600">{t('homeStartSellingFreeBtn')} <ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: 'linear-gradient(135deg,#0A0918 0%,#15145A 50%,#1E0A4E 100%)' }}>
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-indigo-300 px-3 py-1 rounded-full mb-3 border border-white/10">
                <Star className="h-3 w-3 fill-current" /> {t('homeForLocalBusinesses')}
              </span>
              <p className="text-2xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>
                {t('homeStartSelling')}<br />
                <span style={{ background: 'linear-gradient(90deg,#818CF8,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('homeOnLocalKart')}
                </span>
              </p>
              <p className="text-xs text-white/50 font-semibold mt-2">{t('homeReachCustomers')}</p>
              <Link href={buildLoginUrl({ intent: 'seller', redirect: SELLER_ONBOARDING_PATH })}>
                <button className="mt-4 inline-flex items-center gap-2 bg-white font-extrabold text-xs px-5 py-2.5 rounded-xl" style={{ color: '#3D5AF1' }}>
                  {t('homeStartSellingFree')} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <span className="text-6xl select-none flex-shrink-0">🏪</span>
          </div>
        </div>
      </div>

      <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
        <HowItWorksSection />
      </section>

      <section className="mt-3 pt-4 pb-5">
        <FounderSection />
      </section>

      <div className="h-24" />
    </div>
  );
}
