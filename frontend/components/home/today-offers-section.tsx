'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { useLocationStore } from '@/store/location-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function TodayOffersSection() {
  const { location } = useLocationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['today-offers', location?.latitude, location?.longitude],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (location?.latitude) params.append('lat', String(location.latitude));
      if (location?.longitude) params.append('lng', String(location.longitude));
      const { data } = await axios.get(`${API_URL}/catalog/today-offers?${params}`);
      return data.data;
    },
    enabled: !!location,
  });

  if (!location || (!isLoading && !data?.length)) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-accent/10 p-1.5">
          <Zap className="h-5 w-5 text-accent" />
        </div>
        <h2 className="font-heading text-xl font-bold">Today's Offers</h2>
        <Badge variant="outline" className="ml-auto">
          24h only
        </Badge>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-40 flex-shrink-0 rounded-xl" />
          ))
        ) : (
          data?.map((product: any) => {
            const offer = product.daily_offers?.[0];
            return (
              <Link key={product.id} href={`/product/${product.slug}`}>
                <Card className="relative w-40 flex-shrink-0 overflow-hidden border-accent/30 hover:shadow-soft">
                  <div className="absolute left-2 top-2 z-10">
                    <Badge className="bg-accent text-white">
                      -{offer?.discountPercentage}%
                    </Badge>
                  </div>
                  <div className="relative aspect-square">
                    <Image
                      src={product.images?.[0] || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold text-primary">
                        {formatPrice(offer?.offerPrice)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(offer?.originalPrice)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Ends {new Date(offer?.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
