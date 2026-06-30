'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Clock, ChevronRight, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

export function DailyOffersSection() {
  const { data: offers, isLoading } = useQuery({
    queryKey: ['home-daily-offers'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/seller/daily-offers/active`);
      return data?.slice(0, 6) || [];
    },
    staleTime: 60000,
  });

  if (isLoading || !offers?.length) return null;

  return (
    <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
      <div className="section-header px-4 mb-3">
        <h2 className="section-title flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-orange-50">
            <Zap className="h-4 w-4 text-orange-500" />
          </span>
          ⚡ Daily Deals
        </h2>
        <Link href="/browse" className="section-link text-xs text-primary font-semibold flex items-center gap-0.5">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {offers.map((offer: any) => {
          const product = offer.product;
          if (!product) return null;
          const discount = Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100);
          const hoursLeft = Math.max(0, Math.round((new Date(offer.expiresAt).getTime() - Date.now()) / 3600000));

          return (
            <Link
              key={offer.id}
              href={`/browse/${product.categoryType}/product/${product.slug}`}
              className="flex-shrink-0 w-36 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <div className="relative aspect-square bg-gray-50">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-gray-200" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                  -{discount}%
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight">{product.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(offer.offerPrice)}</span>
                  <span className="text-[10px] text-gray-400 line-through">{formatPrice(offer.originalPrice)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-2.5 w-2.5 text-orange-500" />
                  <span className="text-[10px] text-orange-600 font-semibold">{hoursLeft}h left</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
