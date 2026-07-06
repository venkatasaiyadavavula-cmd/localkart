'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, normalizeList, getProductUrl } from '@/lib/utils';
import { getOfferOnProduct } from '@/lib/daily-offer-questions';
import { OfferCountdown } from '@/components/offers/offer-countdown';
import { useLocationStore } from '@/store/location-store';
import { useTranslation } from '@/hooks/use-translation';
import type { ProductWithOffer } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface TodayOffersSectionProps {
  showHeader?: boolean;
}

export function TodayOffersSection({ showHeader = true }: TodayOffersSectionProps) {
  const { location } = useLocationStore();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<ProductWithOffer[]>({
    queryKey: ['today-offers', location?.latitude, location?.longitude],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (location?.latitude) params.append('lat', String(location.latitude));
      if (location?.longitude) params.append('lng', String(location.longitude));
      const { data: res } = await axios.get(`${API_URL}/catalog/today-offers?${params}`);
      return normalizeList<ProductWithOffer>(res);
    },
    refetchInterval: 60_000,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="px-4 py-5">
      <div
        className="relative overflow-hidden rounded-3xl border border-orange-200/60 p-4 sm:p-5"
        style={{
          background: 'linear-gradient(145deg,#FFF7ED 0%,#FFFFFF 45%,#FFF1F2 100%)',
          boxShadow: '0 20px 50px -20px rgba(234,88,12,0.35), 0 8px 24px -12px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ background: '#FB923C' }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full opacity-20 blur-3xl"
          style={{ background: '#F97316' }}
        />

        {showHeader && (
          <div className="relative mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg,#FF6B35,#EA580C)',
                  boxShadow: '0 8px 24px rgba(234,88,12,0.35)',
                }}
              >
                <Zap className="h-5 w-5 text-white fill-white" />
              </motion.div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">
                  24 Hours Only
                </p>
                <h2
                  className="text-xl font-black text-gray-900 sm:text-2xl"
                  style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}
                >
                  {t('homeTodaysOffers')}
                </h2>
              </div>
            </div>
            <Link
              href="/browse?sale=true"
              className="flex items-center gap-1 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-orange-600 shadow-sm backdrop-blur-sm transition hover:bg-orange-50"
            >
              {t('seeAll')} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="relative flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-44 flex-shrink-0 snap-start rounded-2xl" />
              ))
            : data?.map((product, index) => {
                const offer = getOfferOnProduct(product);
                if (!offer) return null;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.35 }}
                    className="snap-start"
                  >
                    <Link href={getProductUrl(product)}>
                      <div
                        className="group relative w-44 flex-shrink-0 overflow-hidden rounded-2xl border border-white bg-white transition-all duration-300 hover:-translate-y-1"
                        style={{
                          boxShadow: '0 12px 32px -12px rgba(234,88,12,0.25), 0 4px 16px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div
                          className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold text-white"
                          style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }}
                        >
                          <Sparkles className="h-3 w-3" />-{offer.discountPercentage}%
                        </div>

                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          <Image
                            src={product.images?.[0] || '/assets/placeholders/product-placeholder.svg'}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="176px"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-8">
                            <OfferCountdown
                              expiresAt={offer.expiresAt as string}
                              className="text-white"
                              urgentClassName="text-yellow-200"
                            />
                          </div>
                        </div>

                        <div className="p-3">
                          <p className="line-clamp-2 text-xs font-bold text-gray-800 leading-snug">
                            {product.name}
                          </p>
                          {product.shop?.name && (
                            <p className="mt-0.5 truncate text-[10px] text-gray-400">{product.shop.name}</p>
                          )}
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-base font-black text-orange-600">
                              {formatPrice(offer.offerPrice)}
                            </span>
                            <span className="text-[10px] text-gray-400 line-through">
                              {formatPrice(offer.originalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
