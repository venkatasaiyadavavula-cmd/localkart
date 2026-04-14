'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Store, Star, ChevronRight, Package, Truck } from 'lucide-react';

import { ProductGrid } from '@/components/product/product-grid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useShop } from '@/hooks/use-shop';
import { useProducts } from '@/hooks/use-products';
import { formatDistance } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: shop, isLoading: shopLoading } = useShop(slug);
  const { data: products, isLoading: productsLoading } = useProducts({
    shopId: shop?.id,
    limit: 20,
  });

  if (shopLoading) {
    return <ShopSkeleton />;
  }

  if (!shop) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold">Shop not found</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20 md:h-64">
        {shop.bannerImage ? (
          <Image
            src={shop.bannerImage}
            alt={shop.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        )}
      </div>

      <div className="container">
        {/* Shop Info Card */}
        <div className="relative -mt-16 mb-8">
          <div className="rounded-2xl bg-card p-6 shadow-soft-lg">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Logo */}
              <div className="relative -mt-16 h-24 w-24 overflow-hidden rounded-xl border-4 border-background bg-card shadow-soft md:-mt-20 md:h-32 md:w-32">
                {shop.logoImage ? (
                  <Image
                    src={shop.logoImage}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10">
                    <Store className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                        {shop.name}
                      </h1>
                      <Badge variant="outline" className="capitalize">
                        {shop.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {shop.city}, {shop.state}
                        {shop.distance && <span> • {formatDistance(shop.distance)} away</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {shop.rating} ({shop.reviewCount} reviews)
                      </div>
                    </div>
                  </div>

                  <Button variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </div>

                <p className="mt-4 text-muted-foreground">{shop.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {shop.openingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {shop.openingTime} - {shop.closingTime}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Delivery: ₹{shop.deliveryCharge} | Free above ₹{shop.freeDeliveryAbove}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Tabs */}
        <Tabs defaultValue="all" className="pb-12">
          <TabsList className="w-full justify-start border-b bg-transparent p-0">
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="new">New Arrivals</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-6">
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : (
              <ProductGrid products={products?.data || []} viewMode="grid" />
            )}
          </TabsContent>
          <TabsContent value="trending" className="pt-6">
            <ProductGrid products={products?.data.slice(0, 4) || []} viewMode="grid" />
          </TabsContent>
          <TabsContent value="new" className="pt-6">
            <ProductGrid products={products?.data.slice(0, 4) || []} viewMode="grid" />
          </TabsContent>
          <TabsContent value="offers" className="pt-6">
            <ProductGrid
              products={products?.data.filter((p) => p.discountPercentage) || []}
              viewMode="grid"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div>
      <Skeleton className="h-48 w-full md:h-64" />
      <div className="container">
        <div className="relative -mt-16 mb-8">
          <div className="rounded-2xl bg-card p-6 shadow-soft-lg">
            <div className="flex flex-col gap-6 md:flex-row">
              <Skeleton className="h-24 w-24 rounded-xl md:h-32 md:w-32" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
