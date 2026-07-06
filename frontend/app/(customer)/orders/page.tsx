'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Search, Navigation, Radio } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/use-orders';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatus } from '@/types/order';
import { canTrackLive } from '@/lib/order-tracking';

const statusColors: Record<string, string> = {
  pending_otp: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending_otp: 'Pending OTP',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const isLiveView = searchParams.get('live') === '1';
  const [activeTab, setActiveTab] = useState(isLiveView ? 'confirmed' : 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLiveView) setActiveTab('confirmed');
  }, [isLiveView]);

  const { data, isLoading } = useOrders({
    status: activeTab !== 'all' && activeTab !== 'active' ? activeTab : undefined,
  });

  const ACTIVE_STATUSES = ['pending_otp', 'confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery'];

  const filteredOrders = data?.filter(
    (order: { orderNumber: string; shop?: { name: string }; status: string }) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      if (!matchesSearch) return false;
      if (activeTab === 'active') return ACTIVE_STATUSES.includes(order.status);
      return true;
    },
  );

  return (
    <div className="container py-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        {isLiveView ? 'Live Order Tracking' : 'My Orders'}
      </h1>
      {isLiveView && (
        <p className="mt-1 text-sm text-muted-foreground">
          Track your active deliveries in real time
        </p>
      )}

      {/* Search & Filter */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number or shop..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-48" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <Skeleton className="h-16 w-16 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredOrders?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Start shopping to place your first order'}
            </p>
            {!searchQuery && (
              <Button asChild className="mt-4">
                <Link href="/browse">Browse Products</Link>
              </Button>
            )}
          </motion.div>
        ) : (
          filteredOrders?.map((order: any) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-soft">
                <CardContent className="p-0">
                  <Link href={`/orders/${order.id}`}>
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            #{order.orderNumber}
                          </span>
                          <Badge className={statusColors[order.status as OrderStatus] || ''}>
                            {statusLabels[order.status as OrderStatus] || order.status}
                          </Badge>
                          {order.status === 'out_for_delivery' && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                              <Radio className="h-2.5 w-2.5 animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'dd MMM yyyy')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.shop?.name ?? 'Shop'}
                      </p>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-1 gap-2 overflow-x-auto pb-2">
                          {order.items.slice(0, 4).map((item: any) => (
                            <div
                              key={item.id}
                              className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                            >
                              {item.productImage ? (
                                <Image
                                  src={item.productImage}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                              <span className="text-sm text-muted-foreground">
                                +{order.items.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
                          <ChevronRight className="ml-auto mt-2 h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {canTrackLive(order.status) && order.status !== 'pending_otp' && (
                    <div className="border-t px-4 py-3">
                      <Link
                        href={`/orders/track?id=${order.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{
                          background:
                            order.status === 'out_for_delivery'
                              ? 'linear-gradient(135deg,#059669,#047857)'
                              : 'linear-gradient(135deg,#3D5AF1,#6D28D9)',
                        }}
                      >
                        <Navigation className="h-4 w-4" />
                        {order.status === 'out_for_delivery' ? 'Track Live on Map' : 'Track Order'}
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
