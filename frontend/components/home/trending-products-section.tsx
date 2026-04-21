'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function TrendingProductsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/products`, {
        params: { sortBy: 'orderCount', sortOrder: 'DESC', limit: 8 },
      });
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-center">Trending Products</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-center">Trending Products</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data?.map((product: any) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <Card className="overflow-hidden hover:shadow-soft transition-shadow h-full">
              <div className="relative aspect-square bg-muted">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <ShoppingBag className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium line-clamp-1">{product.name}</p>
                <p className="text-sm font-bold text-primary">{formatPrice(product.price)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
