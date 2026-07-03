'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Play, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { formatPrice, normalizeList } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

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

  const { data: featured } = useQuery({
    queryKey: ['home-featured-videos'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/featured-videos`, { params: { limit: 8 } });
      return normalizeList(data);
    },
    staleTime: 60000,
  });

  const { data: fallbackProducts } = useQuery({
    queryKey: ['home-video-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/products`, {
        params: { hasVideo: true, limit: 4, sortBy: 'createdAt', sortOrder: 'DESC' },
      });
      const list = normalizeList(data);
      return list.filter((p: { videos?: unknown[] }) => p.videos?.length);
    },
    enabled: !featured?.length,
    staleTime: 120000,
  });

  const items = featured?.length
    ? featured.map((fv: {
        id: string;
        videoUrl: string;
        expiresAt: string;
        product: { id: string; name: string; price: number; slug?: string };
      }) => ({
        id: fv.id,
        videoUrl: fv.videoUrl,
        name: fv.product?.name,
        price: fv.product?.price,
        slug: fv.product?.slug,
        expiresAt: fv.expiresAt,
        isFeatured: true,
      }))
    : (fallbackProducts || []).map((p: { id: string; videos: string[]; name: string; price: number; slug?: string }) => ({
        id: p.id,
        videoUrl: p.videos[0],
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
            {featured?.length ? (
              <Sparkles className="h-4 w-4 text-purple-600" />
            ) : (
              <Play className="h-4 w-4 text-purple-600 fill-purple-600" />
            )}
          </span>
          {featured?.length ? t('suggestedVideos') : '🎬 Product Videos'}
        </h2>
        <Link href="/videos" className="section-link text-xs text-primary font-semibold flex items-center gap-0.5">
          Watch all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {items.slice(0, 6).map((item: {
          id: string;
          videoUrl: string;
          name: string;
          price: number;
          expiresAt?: string;
          isFeatured: boolean;
        }) => (
          <Link
            key={item.id}
            href="/videos"
            className="flex-shrink-0 w-28 relative rounded-2xl overflow-hidden aspect-[9/16] bg-gray-900 shadow-md"
          >
            <video
              src={item.videoUrl}
              className="w-full h-full object-cover opacity-80"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {item.isFeatured && (
              <span className="absolute top-2 left-2 flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow">
                <Sparkles className="h-2.5 w-2.5" />
                {t('featuredVideoBadge')}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{item.name}</p>
              <div className="flex items-center justify-between mt-0.5 gap-1">
                <p className="text-white/80 text-[10px]">{formatPrice(item.price)}</p>
                {item.expiresAt && <Countdown expiresAt={item.expiresAt} />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
