'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import {
  Heart, ShoppingBag, Share2, Play, Pause,
  Volume2, VolumeX, ChevronUp, ChevronDown, X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, normalizeList, getProductUrl } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function VideoFeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['video-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/catalog/products`, {
        params: { hasVideo: true, limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' },
      });
      return normalizeList(data).filter((p: { videos?: string[] }) => p.videos?.length);
    },
  });

  useEffect(() => {
    const videos = videoRefs.current;
    videos.forEach((v, i) => {
      if (!v) return;
      if (i === currentIndex) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (!products) return;
    if (direction === 'down' && currentIndex < products.length - 1) {
      setCurrentIndex(i => i + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  // Touch swipe handling
  const touchStart = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) handleScroll(diff > 0 ? 'down' : 'up');
  };

  const handleShare = async (product: any) => {
    const url = `${window.location.origin}${getProductUrl(product)}`;
    const text = `${product.name} - ${formatPrice(product.price)} - LocalKart lo check cheyyandi!`;
    if (navigator.share) {
      await navigator.share({ title: product.name, text, url });
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
      window.open(waUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <Play className="h-16 w-16 opacity-30" />
        <p className="text-lg font-semibold opacity-60">No videos yet</p>
        <p className="text-sm opacity-40">Sellers upload videos to show products</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen bg-black overflow-hidden relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {products.map((product: any, index: number) => (
        <div
          key={product.id}
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `translateY(${(index - currentIndex) * 100}%)` }}
        >
          {/* Video */}
          <video
            ref={el => { videoRefs.current[index] = el; }}
            src={product.videos[0]}
            className="w-full h-full object-cover"
            loop
            muted={muted}
            playsInline
            onClick={() => {
              const v = videoRefs.current[index];
              if (v) v.paused ? v.play() : v.pause();
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4">
            <span className="text-white font-bold text-lg">🛒 Videos</span>
            <button onClick={() => setMuted(!muted)} className="text-white p-2">
              {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
          </div>

          {/* Right actions */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
            <button
              onClick={() => {
                const newLiked = new Set(liked);
                newLiked.has(product.id) ? newLiked.delete(product.id) : newLiked.add(product.id);
                setLiked(newLiked);
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Heart className={`h-6 w-6 ${liked.has(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </div>
              <span className="text-white text-xs">Like</span>
            </button>

            <button onClick={() => handleShare(product)} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-white text-xs">Share</span>
            </button>

            {/* Seller avatar */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white font-bold text-lg">
                  {product.shop?.name?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
              <span className="text-white text-xs text-center max-w-[56px] truncate">
                {product.shop?.name?.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-16 px-4 pb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-sm font-semibold">{product.shop?.name}</span>
              {product.shop?.slug && (
                <Link href={`/shop/${product.shop.slug}`}
                  className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  View Shop
                </Link>
              )}
            </div>
            <p className="text-white font-medium text-base line-clamp-2 mb-3">{product.name}</p>

            {/* Buy button */}
            <Link href={getProductUrl(product)}>
              <button className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-3 rounded-full text-sm w-full justify-center">
                <ShoppingBag className="h-4 w-4" />
                Buy Now — {formatPrice(product.price)}
              </button>
            </Link>
          </div>

          {/* Scroll indicators */}
          {index > 0 && index === currentIndex && (
            <button
              onClick={() => handleScroll('up')}
              className="absolute top-20 right-4 text-white/50"
            >
              <ChevronUp className="h-8 w-8" />
            </button>
          )}
          {products && index < products.length - 1 && index === currentIndex && (
            <button
              onClick={() => handleScroll('down')}
              className="absolute bottom-28 right-4 text-white/50"
            >
              <ChevronDown className="h-8 w-8" />
            </button>
          )}
        </div>
      ))}

      {/* Progress dots */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {products.slice(0, 8).map((_: any, i: number) => (
          <div key={i} className={`w-1 rounded-full transition-all ${
            i === currentIndex ? 'h-6 bg-white' : 'h-2 bg-white/30'
          }`} />
        ))}
      </div>
    </div>
  );
}
