'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistance } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface NearbyShopsSectionProps {
  latitude: number;
  longitude: number;
}

export function NearbyShopsSection({ latitude, longitude }: NearbyShopsSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['nearby-shops', latitude, longitude],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/location/nearby-shops`, {
        params: { latitude, longitude, radius: 10, limit: 8 },
      });
      return data.data;
    },
    enabled: !!latitude && !!longitude,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold">Nearby Shops</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">Nearby Shops</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/browse">View All</Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.slice(0, 4).map((shop: any) => (
          <Link key={shop.id} href={`/shop/${shop.slug}`}>
            <Card className="overflow-hidden hover:shadow-soft transition-shadow h-full">
              <div className="relative h-24 bg-muted">
                {shop.logoImage ? (
                  <Image src={shop.logoImage} alt={shop.name} fill className="object-cover" />
                ) : (
                  <Store className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium line-clamp-1">{shop.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {shop.distance ? formatDistance(shop.distance) : 'Nearby'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
