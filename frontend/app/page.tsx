'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronRight, Bell, Tag, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useLocationStore } from '@/store/location-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { NearbyShopsSection } from '@/components/home/nearby-shops-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { TrendingProductsSection } from '@/components/home/trending-products-section';
import { LocationDialog } from '@/components/location/location-dialog';

export default function HomePage() {
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { latitude, longitude, loading: locationLoading, error: locationError, detectLocation } = useGeolocation();
  const { location: savedLocation, setLocation } = useLocationStore();

  useEffect(() => {
    if (latitude && longitude && !savedLocation) {
      setLocation({ latitude, longitude, source: 'gps' });
    }
  }, [latitude, longitude, savedLocation, setLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleDetectLocation = async () => {
    await detectLocation();
    setShowLocationDialog(false);
  };

  const banners = [
    { bg: 'from-orange-400 to-pink-500', text: '70% OFF', sub: 'Fashion & Clothing', emoji: '👗' },
    { bg: 'from-blue-400 to-purple-500', text: 'NEW ARRIVALS', sub: 'Electronics & Gadgets', emoji: '📱' },
    { bg: 'from-green-400 to-teal-500', text: 'FRESH DAILY', sub: 'Groceries & Veggies', emoji: '🥦' },
  ];

  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveBanner(p => (p + 1) % banners.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onDetectLocation={handleDetectLocation}
        locationLoading={locationLoading}
        locationError={locationError}
      />

      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="bg-primary px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setShowLocationDialog(true)}
            className="flex items-center gap-1 text-white text-sm"
          >
            <MapPin className="h-4 w-4" />
            <span className="font-medium truncate max-w-[200px]">
              {savedLocation ? 'Kadapa, Andhra Pradesh' : 'Set Delivery Location'}
            </span>
            <ChevronRight className="h-3 w-3" />
          </button>
          <Link href="/orders" className="text-white">
            <Bell className="h-5 w-5" />
          </Link>
        </div>

        <form onSubmit={handleSearch} className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sarees, mobiles, groceries..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Banner Carousel */}
      <div className="px-4 pt-3 pb-2">
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${banners[activeBanner].bg} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black">{banners[activeBanner].text}</p>
              <p className="text-sm opacity-90 mt-1">{banners[activeBanner].sub}</p>
              <Link href="/browse">
                <button className="mt-3 bg-white text-gray-800 text-xs font-bold px-4 py-1.5 rounded-full">
                  Shop Now →
                </button>
              </Link>
            </div>
            <span className="text-6xl">{banners[activeBanner].emoji}</span>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeBanner ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="px-4 py-2 grid grid-cols-3 gap-2">
        {[
          { icon: Truck, text: 'Same Day', sub: 'Delivery' },
          { icon: RotateCcw, text: 'Easy', sub: 'Returns' },
          { icon: Tag, text: 'Best', sub: 'Prices' },
        ].map(({ icon: Icon, text, sub }) => (
          <div key={text} className="bg-white rounded-xl p-2.5 flex items-center gap-2 shadow-sm">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">{text}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="pt-3 pb-2">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Shop by Category</h2>
          <Link href="/browse" className="text-xs text-primary font-medium flex items-center gap-0.5">
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <CategoriesSection />
      </div>

      {/* Trending Products */}
      <div className="pt-2 pb-3 bg-white mt-2">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">🔥 Trending Now</h2>
          <Link href="/browse" className="text-xs text-primary font-medium flex items-center gap-0.5">
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <TrendingProductsSection />
      </div>

      {/* Nearby Shops */}
      {savedLocation && (
        <div className="pt-2 pb-3 mt-2 bg-white">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">🏪 Shops Near You</h2>
            <Link href="/browse" className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <NearbyShopsSection latitude={savedLocation.latitude} longitude={savedLocation.longitude} />
        </div>
      )}

      {/* Sell on LocalKart */}
      <div className="px-4 py-4 mt-2">
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">Sell on LocalKart</p>
            <p className="text-sm opacity-90 mt-0.5">Grow your local business online</p>
            <Link href="/seller-onboarding">
              <button className="mt-3 bg-white text-primary text-xs font-bold px-4 py-1.5 rounded-full">
                Start Selling →
              </button>
            </Link>
          </div>
          <span className="text-5xl">🏪</span>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
