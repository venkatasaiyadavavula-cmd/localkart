'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { staffWorkApi } from '@/lib/api/staff-work';
import { formatPrice, normalizeList } from '@/lib/utils';
import { formatDeliveryAddress } from '@/lib/utils/api';
import { DeliveryLocationPanel } from '@/components/seller/delivery-location-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusFlow: Record<string, { next: string; label: string }> = {
  confirmed:        { next: 'processing',        label: '✅ Accept Order' },
  processing:       { next: 'ready_for_pickup',  label: '📦 Mark Ready' },
  ready_for_pickup: { next: 'out_for_delivery',  label: '🛵 Out for Delivery' },
  out_for_delivery: { next: 'delivered',         label: '✓ Mark Delivered' },
};

const tabs = [
  { label: '🔔 New', value: 'confirmed' },
  { label: '📦 Active', value: 'processing' },
  { label: '🛵 Delivery', value: 'out_for_delivery' },
  { label: '✅ Done', value: 'delivered' },
];

export default function WorkOrdersPage() {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['staff', 'orders'],
    queryFn: async () => {
      const res = await staffWorkApi.getOrders(1);
      return normalizeList<{ status: string; id: string; orderNumber: string; createdAt: string; totalAmount: number; items?: any[]; deliveryAddress?: any; deliveryStaffName?: string }>(res);
    },
  });

  const orders = (allOrders ?? []).filter((order) => {
    if (activeTab === 'processing') {
      return ['processing', 'ready_for_pickup'].includes(order.status);
    }
    return order.status === activeTab;
  });

  const newCount = (allOrders ?? []).filter((o) => o.status === 'confirmed').length;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      staffWorkApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Order updated');
      qc.invalidateQueries({ queryKey: ['staff', 'orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
    },
    onSettled: () => setUpdatingId(null),
  });

  const handleUpdate = (orderId: string, status: string) => {
    setUpdatingId(orderId);
    updateStatus.mutate({ id: orderId, status });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Orders & Deliveries</h1>
        <p className="text-xs text-gray-500">
          {newCount > 0 ? `🔔 ${newCount} new order${newCount > 1 ? 's' : ''} waiting` : 'Accept and deliver orders'}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold relative',
              activeTab === tab.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600',
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

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Truck className="mx-auto h-12 w-12 mb-2 opacity-30" />
          <p className="font-semibold">No orders in this tab</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const next = statusFlow[order.status];
            return (
              <div key={order.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'dd MMM · hh:mm a')}</p>
                  </div>
                  <p className="font-black text-gray-900">{formatPrice(order.totalAmount)}</p>
                </div>

                <div className="mt-2 space-y-1">
                  {order.items?.slice(0, 3).map((item: any) => (
                    <p key={item.id} className="text-xs text-gray-600">
                      {item.quantity}× {item.productName}
                    </p>
                  ))}
                </div>

                {order.deliveryAddress && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                    📍 {formatDeliveryAddress(order.deliveryAddress)}
                  </p>
                )}

                {next && (
                  <Button
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={updatingId === order.id}
                    onClick={() => handleUpdate(order.id, next.next)}
                  >
                    {updatingId === order.id ? 'Updating...' : next.label}
                  </Button>
                )}

                {order.status === 'out_for_delivery' && (
                  <DeliveryLocationPanel orderId={order.id} staffName={order.deliveryStaffName} />
                )}

                {order.status === 'delivered' && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-600">
                    <CheckCircle className="h-3 w-3" /> Delivered
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
