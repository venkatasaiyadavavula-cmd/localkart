'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Play, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { formatPrice, normalizeList } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import type { FeaturedVideo, VideoPreviewItem } from '@/types/api';
import type { Product } from '@/types/product';

const API = process.env.NEXT_PUBLIC_API_URL;

function formatCountdown(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState(formatCountdown(expiresAt));

  useEffect(() => {
    const tick = () => setLabel(formatCountdown(expiresAt));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-100">
      <Clock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export function VideoPreviewSection() {
  const { t } = useTranslation();

  const { data: featured = [] } = useQuery<FeaturedVideo[]>({
    queryKey: ['home-featured-videos'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/featured-videos`, { params: { limit: 8 } });
      return normalizeList<FeaturedVideo>(data);
    },
    staleTime: 60000,
  });

  const { data: fallbackProducts = [] } = useQuery<Product[]>({
    queryKey: ['home-video-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/products`, {
        params: { hasVideo: true, limit: 4, sortBy: 'createdAt', sortOrder: 'DESC' },
      });
      const list = normalizeList<Product>(data);
      return list.filter((p) => (p.videos?.length ?? 0) > 0);
    },
    enabled: featured.length === 0,
    staleTime: 120000,
  });

  const items: VideoPreviewItem[] = featured.length
    ? featured.map((fv) => ({
        id: fv.id,
        videoUrl: fv.videoUrl,
        name: fv.product?.name ?? '',
        price: fv.product?.price ?? 0,
        slug: fv.product?.slug,
        expiresAt: fv.expiresAt,
        isFeatured: true,
      }))
    : fallbackProducts.map((p) => ({
        id: p.id,
        videoUrl: p.videos?.[0] ?? '',
        name: p.name,
        price: p.price,
        slug: p.slug,
        isFeatured: false,
      }));

  if (!items.length) return null;

  return (
    <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
      <div className="section-header px-4 mb-3">
        <h2 className="section-title flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-purple-50">
            {featured.length ? (
              <Sparkles className="h-4 w-4 text-purple-600" />
            ) : (
              <Play className="h-4 w-4 text-purple-600 fill-purple-600" />
            )}
          </span>
          {t('homeWatchAndShop')}
        </h2>
        <Link href="/videos" className="section-link">
          {t('seeAll')} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar snap-x snap-mandatory">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.slug ? `/browse/fashion/product/${item.slug}` : '/videos'}
            className="snap-start flex-shrink-0 w-28"
          >
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 shadow-md">
              <video
                src={item.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {item.isFeatured && item.expiresAt && (
                <div className="absolute top-2 left-2">
                  <Countdown expiresAt={item.expiresAt} />
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{item.name}</p>
                <p className="text-[10px] font-black text-amber-300 mt-0.5">{formatPrice(item.price)}</p>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-3.5 w-3.5 text-white fill-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
