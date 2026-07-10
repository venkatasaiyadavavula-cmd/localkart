'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star, Flame, TrendingUp, Plus } from 'lucide-react';
import { formatPrice, normalizeList, getProductUrl } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-config';

function ProductSkeleton() {
  return (
    <div className="px-4">
      <div
        className="grid gap-px overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderRadius: '20px',
          background: '#E5E9F2',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white flex flex-col">
            <div className="aspect-square skeleton-shimmer" />
            <div className="p-2 space-y-1.5">
              <div className="h-2.5 w-full rounded-full skeleton-shimmer" />
              <div className="h-2.5 w-3/4 rounded-full skeleton-shimmer" />
              <div className="h-3 w-1/2 rounded-full skeleton-shimmer mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendingProductsSection() {
  const { addItem } = useCartStore();
  const { data, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/products`, {
        params: { sortBy: 'orderCount', sortOrder: 'DESC', limit: 6 },
      });
      return normalizeList(data);
    },
  });

  if (isLoading) return <ProductSkeleton />;
  if (!data?.length) return null;

  return (
    <div className="px-4">
      <div
        className="grid gap-px overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderRadius: '20px',
          background: '#E5E9F2',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {data.map((product: any, idx: number) => {
          const discount = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;

          /* top-2 products get 🔥 hot badge */
          const isHot  = idx < 2;
          /* top product gets a crown */
          const isTop  = idx === 0;

          /* corner radius for grid corners */
          const radius = {
            0: '20px 0 0 0',
            2: '0 20px 0 0',
            3: '0 0 0 20px',
            5: '0 0 20px 0',
          }[idx] ?? '0';

          return (
            <Link
              key={product.id}
              href={getProductUrl(product)}
              className="outline-none"
            >
              <div
                className="bg-white flex flex-col h-full group relative overflow-hidden"
                style={{ borderRadius: radius }}
              >

                {/* ── Image area ── */}
                <div className="relative aspect-square overflow-hidden" style={{ background: '#F8F9FC' }}>

                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                      sizes="(max-width:768px) 33vw, 200px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8" style={{ color: '#CBD5E1' }} />
                    </div>
                  )}

                  {/* Gradient overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 60%)' }}
                  />

                  {/* Discount badge — bottom-left */}
                  {discount > 0 && (
                    <div
                      className="absolute bottom-1.5 left-1.5 text-white text-[10px] font-extrabold px-1.5 py-0.5 leading-none"
                      style={{
                        background:   'linear-gradient(135deg,#EF4444,#DC2626)',
                        borderRadius: '7px',
                        boxShadow:    '0 2px 8px rgba(239,68,68,0.40)',
                      }}
                    >
                      -{discount}%
                    </div>
                  )}

                  {/* 🔥 Hot badge — top-right */}
                  {isHot && (
                    <div
                      className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6"
                      style={{
                        background:   'linear-gradient(135deg,#FF6B35,#FF4D6D)',
                        borderRadius: '8px',
                        boxShadow:    '0 2px 8px rgba(255,107,53,0.45)',
                      }}
                    >
                      <Flame className="h-3 w-3 text-white" strokeWidth={2.5} />
                    </div>
                  )}

                  {/* 👑 #1 crown badge */}
                  {isTop && (
                    <div
                      className="absolute top-1.5 left-1.5 text-[10px] font-extrabold text-white px-1.5 py-0.5 leading-none flex items-center gap-0.5"
                      style={{
                        background:   'linear-gradient(135deg,#F59E0B,#D97706)',
                        borderRadius: '7px',
                        boxShadow:    '0 2px 8px rgba(245,158,11,0.45)',
                      }}
                    >
                      👑 #1
                    </div>
                  )}

                  {/* Quick-add button — appears on hover (desktop) */}
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        await addItem(product.id, 1);
                      } catch {
                        // addItem shows error toast
                      }
                    }}
                    className="absolute bottom-1.5 right-1.5 hidden md:flex items-center justify-center w-7 h-7 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
                    style={{
                      background:   'white',
                      borderRadius: '9px',
                      boxShadow:    '0 2px 10px rgba(0,0,0,0.15)',
                      color:        '#3D5AF1',
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>

                {/* ── Info area ── */}
                <div className="p-2 flex flex-col flex-1">
                  {/* Name */}
                  <p
                    className="text-[11px] leading-[1.35] line-clamp-2 flex-1 mb-1.5"
                    style={{ color: '#374151', fontWeight: 500 }}
                  >
                    {product.name}
                  </p>

                  {/* Price row */}
                  <div className="mt-auto">
                    <p
                      className="text-[13px] font-extrabold leading-none"
                      style={{ color: '#111827' }}
                    >
                      {formatPrice(product.price)}
                    </p>

                    {product.originalPrice && (
                      <p
                        className="text-[10px] line-through leading-none mt-0.5"
                        style={{ color: '#9CA3AF' }}
                      >
                        {formatPrice(product.originalPrice)}
                      </p>
                    )}

                    {/* Rating + sold count */}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-0.5">
                        <Star
                          className="h-2.5 w-2.5 fill-current"
                          style={{ color: '#F59E0B' }}
                        />
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: '#6B7280' }}
                        >
                          4.{(product.id.charCodeAt(0) % 3) + 1}
                        </span>
                      </div>

                      {/* Trending indicator for top 3 */}
                      {idx < 3 && (
                        <div
                          className="flex items-center gap-0.5 px-1.5 py-0.5"
                          style={{
                            background:   '#ECFDF5',
                            borderRadius: '6px',
                          }}
                        >
                          <TrendingUp
                            className="h-2 w-2"
                            style={{ color: '#059669' }}
                            strokeWidth={2.5}
                          />
                          <span
                            className="text-[9px] font-bold"
                            style={{ color: '#059669' }}
                          >
                            HOT
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile tap highlight */}
                <div
                  className="absolute inset-0 opacity-0 active:opacity-100 transition-opacity duration-100 pointer-events-none"
                  style={{ background: 'rgba(61,90,241,0.05)', borderRadius: radius }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
