'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Store, Package, Truck, Shield, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useLocationStore } from '@/store/location-store';
import { NearbyShopsSection } from '@/components/home/nearby-shops-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { TrendingProductsSection } from '@/components/home/trending-products-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { LocationDialog } from '@/components/location/location-dialog';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

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

  return (
    <div className="min-h-screen">
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onDetectLocation={handleDetectLocation}
        locationLoading={locationLoading}
        locationError={locationError}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="container relative mx-auto px-4 py-12 md:py-20 lg:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4" />
              Now in Kadapa, Andhra Pradesh
            </motion.div>

            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Shop <span className="text-gradient">Local</span>,
              <br className="hidden sm:block" /> Delivered{' '}
              <span className="relative inline-block">
                Same Day
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M0,5 Q100,0 200,5" fill="none" stroke="#FF6B35" strokeWidth="3" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Discover thousands of products from trusted local shops near you.
              Support your neighborhood businesses with every purchase.
            </p>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder='Search "groceries", "mobile phones", "sarees"...'
                  className="h-14 pl-12 pr-4 text-base shadow-soft"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 shadow-soft">
                Search
              </Button>
            </motion.form>

            {/* Location Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <button
                onClick={() => setShowLocationDialog(true)}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <MapPin className="h-4 w-4" />
                {savedLocation ? (
                  <span>📍 Location set · Tap to change</span>
                ) : (
                  <span>📍 Set your location for accurate delivery</span>
                )}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Image / Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-16 flex justify-center"
          >
            <div className="relative h-64 w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 p-[2px] shadow-soft-xl">
              <div className="relative h-full w-full overflow-hidden rounded-3xl bg-background">
                <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
                <div className="flex h-full items-center justify-center gap-8 p-8">
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
                      <Store className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">Local Shops</p>
                        <p className="text-sm text-muted-foreground">100+ in Kadapa</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
                      <Truck className="h-8 w-8 text-accent" />
                      <div>
                        <p className="font-semibold">Same Day Delivery</p>
                        <p className="text-sm text-muted-foreground">Within 5 km</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
                      <Shield className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-semibold">Secure Payments</p>
                        <p className="text-sm text-muted-foreground">COD & Online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container">
          <CategoriesSection />
        </div>
      </section>

      {/* Nearby Shops Section (Location Based) */}
      {savedLocation && (
        <section className="bg-muted/30 py-16">
          <div className="container">
            <NearbyShopsSection latitude={savedLocation.latitude} longitude={savedLocation.longitude} />
          </div>
        </section>
      )}

      {/* Trending Products */}
      <section className="py-16">
        <div className="container">
          <TrendingProductsSection />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-20">
        <div className="container">
          <HowItWorksSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20 pt-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-[2px] shadow-soft-xl"
          >
            <div className="relative rounded-3xl bg-background p-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                Are you a local shop owner?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Join LocalKart and grow your business online. Reach more customers in your neighborhood with zero
                commission on your first 30 products.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/seller-onboarding">
                  Start Selling <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
