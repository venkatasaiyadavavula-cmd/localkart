'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function TrendingProductsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/products`, {
        params: { sortBy: 'orderCount', sortOrder: 'DESC', limit: 6 },
      });
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {data.map((product: any) => {
        const discount = product.originalPrice
          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
          : 0;

        return (
          <Link key={product.id} href={`/browse/${product.categoryType}/product/${product.slug}`}>
            <div className="bg-white flex flex-col">
              <div className="relative aspect-square bg-gray-100">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                {discount > 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {discount}% off
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-700 line-clamp-2 leading-tight mb-1">{product.name}</p>
                <p className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</p>
                {product.originalPrice && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                )}
                <div className="flex items-center gap-0.5 mt-1">
                  <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-500">4.2</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
