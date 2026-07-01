'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Play, ChevronRight } from 'lucide-react';
import { formatPrice, normalizeList } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

export function VideoPreviewSection() {
  const { data: products } = useQuery({
    queryKey: ['home-video-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/products`, {
        params: { hasVideo: true, limit: 4, sortBy: 'createdAt', sortOrder: 'DESC' },
      });
      const list = normalizeList(data);
      return list.filter((p: { videos?: unknown[] }) => p.videos?.length);
    },
    staleTime: 120000,
  });

  if (!products?.length) return null;

  return (
    <section className="mt-3 pt-4 pb-5 bg-white border-y border-gray-100/80">
      <div className="section-header px-4 mb-3">
        <h2 className="section-title flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-purple-50">
            <Play className="h-4 w-4 text-purple-600 fill-purple-600" />
          </span>
          🎬 Product Videos
        </h2>
        <Link href="/videos" className="section-link text-xs text-primary font-semibold flex items-center gap-0.5">
          Watch all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {products.slice(0, 4).map((product: any) => (
          <Link
            key={product.id}
            href="/videos"
            className="flex-shrink-0 w-28 relative rounded-2xl overflow-hidden aspect-[9/16] bg-gray-900 shadow-md"
          >
            <video
              src={product.videos[0]}
              className="w-full h-full object-cover opacity-80"
              muted
              playsInline
              preload="metadata"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{product.name}</p>
              <p className="text-white/80 text-[10px] mt-0.5">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
