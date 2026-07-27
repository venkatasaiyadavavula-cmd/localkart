'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatOrderDateTime } from '@/lib/utils/date';
import { toast } from 'sonner';
<<<<<<< Updated upstream
import { Truck, CheckCircle } from 'lucide-react';
=======
import { Truck, CheckCircle, Phone, MapPin } from 'lucide-react';
>>>>>>> Stashed changes
import { staffWorkApi } from '@/lib/api/staff-work';
import { formatPrice, normalizeList } from '@/lib/utils';
import { formatDeliveryAddress } from '@/lib/utils/api';
import { DeliveryLocationPanel } from '@/components/seller/delivery-location-panel';
import { OrderDeliveryOtpDialog } from '@/components/orders/order-delivery-otp-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusFlow: Record<string, { next: string; label: string }> = {
  confirmed:        { next: 'processing',        label: '✅ Accept Order' },
  processing:       { next: 'ready_for_pickup',  label: '📦 Mark Ready' },
  ready_for_pickup: { next: 'out_for_delivery',  label: '🛵 Out for Delivery' },
};

const tabs = [
  { label: '⏳ OTP', value: 'pending_otp' },
  { label: '🔔 New', value: 'confirmed' },
  { label: '📦 Active', value: 'processing' },
  { label: '🛵 Delivery', value: 'out_for_delivery' },
  { label: '✅ Done', value: 'delivered' },
];

type OtpMode = 'confirm_order' | 'confirm_delivery';

export default function WorkOrdersPage() {
  const [activeTab, setActiveTab] = useState('pending_otp');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [otpTarget, setOtpTarget] = useState<{ orderId: string; mode: OtpMode } | null>(null);
  const qc = useQueryClient();

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['staff', 'orders'],
    queryFn: async () => {
      const res = await staffWorkApi.getOrders(1);
      return normalizeList<{
        status: string;
        id: string;
        orderNumber: string;
        createdAt: string;
        totalAmount: number;
        items?: any[];
        deliveryAddress?: any;
        deliveryStaffName?: string;
        customer?: { name?: string; phone?: string };
      }>(res);
    },
  });

  const orders = (allOrders ?? []).filter((order) => {
    if (activeTab === 'processing') {
      return ['processing', 'ready_for_pickup'].includes(order.status);
    }
    return order.status === activeTab;
  });

  const otpCount = (allOrders ?? []).filter((o) => o.status === 'pending_otp').length;
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

  const handleVerifyOtp = async (otp: string) => {
    if (!otpTarget) return;
    try {
      await staffWorkApi.verifyOrderOtp(otpTarget.orderId, otp);
      toast.success(
        otpTarget.mode === 'confirm_delivery'
          ? 'Delivery confirmed with OTP!'
          : 'Order confirmed with OTP!',
      );
      qc.invalidateQueries({ queryKey: ['staff', 'orders'] });
      setOtpTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Orders & Deliveries</h1>
        <p className="text-xs text-gray-500">
          {otpCount > 0 || newCount > 0
            ? [
                otpCount > 0 && `⏳ ${otpCount} awaiting OTP`,
                newCount > 0 && `🔔 ${newCount} new`,
              ].filter(Boolean).join(' · ')
            : 'Accept and deliver orders'}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const badgeCount =
            tab.value === 'pending_otp' ? otpCount :
            tab.value === 'confirmed' ? newCount : 0;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold relative',
                activeTab === tab.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600',
              )}
            >
              {tab.label}
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
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
                    <p className="text-xs text-gray-500">{formatOrderDateTime(order.createdAt)}</p>
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

                {(order.customer?.name || order.customer?.phone) && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                      {order.customer?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      {order.customer?.name && (
                        <p className="text-sm font-semibold text-gray-800">{order.customer.name}</p>
                      )}
                      {order.customer?.phone && (
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="text-xs text-gray-500 flex items-center gap-1 hover:text-emerald-600 active:text-emerald-700"
                        >
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="underline-offset-2 hover:underline">{order.customer.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {order.deliveryAddress && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-gray-50 p-2.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {formatDeliveryAddress(order.deliveryAddress)}
                    </p>
                  </div>
                )}

                {order.status === 'pending_otp' && (
                  <div className="mt-3">
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => setOtpTarget({ orderId: order.id, mode: 'confirm_order' })}
                    >
                      🔐 Enter Customer OTP to Confirm
                    </Button>
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                      Ask customer for OTP sent to their phone
                    </p>
                  </div>
                )}

                {order.status === 'out_for_delivery' && (
                  <div className="mt-3 space-y-2">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setOtpTarget({ orderId: order.id, mode: 'confirm_delivery' })}
                    >
                      🔐 Enter Customer OTP to Confirm Delivery
                    </Button>
                    <DeliveryLocationPanel orderId={order.id} staffName={order.deliveryStaffName} />
                  </div>
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

      <OrderDeliveryOtpDialog
        open={!!otpTarget}
        onOpenChange={(open) => !open && setOtpTarget(null)}
        title={
          otpTarget?.mode === 'confirm_delivery'
            ? 'Confirm Delivery with OTP'
            : 'Confirm Order with OTP'
        }
        description="Enter the OTP sent to the customer's phone."
        confirmLabel={
          otpTarget?.mode === 'confirm_delivery' ? 'Confirm Delivery' : 'Confirm Order'
        }
        onVerify={handleVerifyOtp}
      />
    </div>
  );
}
