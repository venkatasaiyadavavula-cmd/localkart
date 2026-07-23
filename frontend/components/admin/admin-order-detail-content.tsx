'use client';

import { formatPrice } from '@/lib/utils';
import { formatDeliveryAddress } from '@/lib/utils/api';
import { formatOrderDetailDateTime } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderProgress } from '@/components/orders/order-progress';
import {
  statusColors,
  statusLabels,
  type Order,
} from '@/types/order';

interface AdminOrderDetailContentProps {
  order?: Order | null;
  isLoading?: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  cod: 'Cash on Delivery',
  razorpay: 'Razorpay',
  wallet: 'Wallet',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-blue-100 text-blue-800',
};

export function AdminOrderDetailContent({
  order,
  isLoading,
}: AdminOrderDetailContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-muted-foreground">Order not found.</p>;
  }

  const address =
    order.shippingAddress ?? (order as Order & { deliveryAddress?: unknown }).deliveryAddress;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
        <Badge className={paymentStatusColors[order.paymentStatus] ?? ''}>
          Payment: {order.paymentStatus}
        </Badge>
        <Badge variant="outline">
          {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
        </Badge>
      </div>

      <OrderProgress status={order.status} variant="compact" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Customer</p>
          <p className="text-sm font-medium">{order.customer?.name ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{order.customer?.phone}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Shop</p>
          <p className="text-sm font-medium">{order.shop?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Placed</p>
          <p className="text-sm">{formatOrderDetailDateTime(order.createdAt)}</p>
        </div>
        {order.deliveredAt && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Delivered</p>
            <p className="text-sm">{formatOrderDetailDateTime(order.deliveredAt)}</p>
          </div>
        )}
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-sm font-medium">Items</p>
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Shipping address</p>
        <p className="text-sm text-muted-foreground">{formatDeliveryAddress(address) || '—'}</p>
      </div>

      {order.deliveryNotes && (
        <div>
          <p className="mb-1 text-sm font-medium">Notes</p>
          <p className="text-sm text-muted-foreground">{order.deliveryNotes}</p>
        </div>
      )}

      <Separator />

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(order.subtotal ?? order.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span>{formatPrice(order.deliveryCharge ?? 0)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Commission</span>
          <span>{formatPrice(order.commissionAmount ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}
