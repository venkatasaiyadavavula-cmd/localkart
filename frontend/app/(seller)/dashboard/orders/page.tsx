'use client';

import { useState } from 'react';
import {
  Search, Package, Truck, CheckCircle, Clock,
  XCircle, ChevronRight, Phone, MapPin, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSellerOrders } from '@/hooks/use-seller-orders';
import { formatPrice } from '@/lib/utils';
import { OrderStatus, statusColors, statusLabels } from '@/types/order';
import { cn } from '@/lib/utils';

const statusFlow: Record<string, { next: OrderStatus; label: string; color: string; icon: any }> = {
  confirmed:        { next: 'processing',        label: '✅ Accept Order',      color: 'bg-green-500 hover:bg-green-600',  icon: CheckCircle },
  processing:       { next: 'ready_for_pickup',  label: '📦 Mark Ready',        color: 'bg-blue-500 hover:bg-blue-600',    icon: Package },
  ready_for_pickup: { next: 'out_for_delivery',  label: '🛵 Out for Delivery',  color: 'bg-orange-500 hover:bg-orange-600', icon: Truck },
  out_for_delivery: { next: 'delivered',         label: '✓ Mark Delivered',     color: 'bg-green-600 hover:bg-green-700',  icon: CheckCircle },
};

const statusBadge: Record<string, string> = {
  confirmed:        'bg-blue-100 text-blue-700',
  processing:       'bg-yellow-100 text-yellow-700',
  ready_for_pickup: 'bg-orange-100 text-orange-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
};

const tabs = [
  { label: '🔔 New', value: 'confirmed' },
  { label: '📦 Active', value: 'processing' },
  { label: '🛵 Delivery', value: 'out_for_delivery' },
  { label: '✅ Done', value: 'delivered' },
  { label: 'All', value: 'all' },
];

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, isLoading, updateOrderStatus } = useSellerOrders({
    status: activeTab !== 'all' ? activeTab : undefined,
    search: searchQuery,
  });

  const orders = data?.data || [];

  // Counts for badges
  const { data: allData } = useSellerOrders({});
  const allOrders = allData?.data || [];
  const newCount = allOrders.filter((o: any) => o.status === 'confirmed').length;

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order updated!`);
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Orders</h1>
            {newCount > 0 && (
              <p className="text-xs text-orange-600 font-semibold animate-pulse">
                🔔 {newCount} new order{newCount > 1 ? 's' : ''} waiting!
              </p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search order number..."
            className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all relative',
                activeTab === tab.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {tab.label}
              {tab.value === 'confirmed' && newCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="px-4 py-3 space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))
          : orders.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package className="h-16 w-16 mb-3 text-gray-200" />
              <p className="font-semibold text-gray-600">No orders here</p>
              <p className="text-xs mt-1">Orders will appear when customers buy your products</p>
            </div>
          )
          : orders.map((order: any) => {
            const nextAction = statusFlow[order.status];
            const isUpdating = updatingId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Order header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(order.createdAt), 'dd MMM · hh:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-gray-900">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status === 'confirmed' && '🔔'}
                    {order.status === 'processing' && '📦'}
                    {order.status === 'out_for_delivery' && '🛵'}
                    {order.status === 'delivered' && '✅'}
                    {' '}{statusLabels[order.status as OrderStatus] || order.status}
                  </span>

                  {/* Customer */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                      {order.customer?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{order.customer?.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />{order.customer?.phone}
                      </p>
                    </div>
                  </div>

                  {/* Delivery address */}
                  {order.deliveryAddress && (
                    <div className="mt-2 flex items-start gap-1.5 bg-gray-50 rounded-xl p-2.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600">{order.deliveryAddress}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="mt-3 space-y-1.5">
                    {order.items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate max-w-[200px]">
                          {item.quantity}× {item.product?.name}
                        </span>
                        <span className="font-semibold text-gray-800 flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
                    )}
                  </div>
                </div>

                {/* Action button */}
                {nextAction && (
                  <div className="px-4 pb-4">
                    <Button
                      onClick={() => handleStatusUpdate(order.id, nextAction.next)}
                      disabled={isUpdating}
                      className={`w-full h-11 rounded-xl font-bold text-sm ${nextAction.color} text-white border-0`}
                    >
                      {isUpdating ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Updating...
                        </span>
                      ) : nextAction.label}
                    </Button>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="px-4 pb-4">
                    <div className="bg-green-50 text-green-700 text-xs font-semibold text-center py-2.5 rounded-xl">
                      ✅ Delivered · {formatPrice(order.totalAmount)} earned
                    </div>
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
