'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Clock, ChevronRight, Zap } from 'lucide-react';
import { formatPrice, normalizeList, getProductUrl } from '@/lib/utils';
import { useLocationStore } from '@/store/location-store';

const API = process.env.NEXT_PUBLIC_API_URL;

export function DailyOffersSection() {
  const { location } = useLocationStore();

  const { data: offers, isLoading } = useQuery({
    queryKey: ['home-daily-offers', location?.latitude, location?.longitude],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/today-offers`, {
        params: {
          lat: location?.latitude,
          lng: location?.longitude,
        },
      });
      return normalizeList(data).slice(0, 6);
    },
    enabled: !!location,
    staleTime: 60000,
  });

  if (!location || isLoading || !offers?.length) return null;

  return (
    <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
      <div className="section-header px-4 mb-3">
        <h2 className="section-title flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-orange-50">
            <Zap className="h-4 w-4 text-orange-500" />
          </span>
          Daily Offers
        </h2>
        <Link href="/browse?sale=true" className="section-link">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
        {offers.map((product: any) => {
          const offer = product.daily_offer;
          return (
            <Link key={product.id} href={getProductUrl(product)} className="flex-shrink-0 w-36">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="relative aspect-square bg-gray-50">
                  {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  {offer?.discountPercentage > 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      -{offer.discountPercentage}%
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xs font-bold text-primary">{formatPrice(offer?.offerPrice ?? product.price)}</span>
                    {offer?.originalPrice > (offer?.offerPrice ?? product.price) && (
                      <span className="text-[10px] text-gray-400 line-through">{formatPrice(offer.originalPrice)}</span>
                    )}
                  </div>
                  {offer?.expiresAt && (
                    <div className="mt-1 flex items-center gap-0.5 text-[9px] text-gray-400">
                      <Clock className="h-2.5 w-2.5" />
                      Ends {new Date(offer.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
