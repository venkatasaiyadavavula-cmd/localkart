'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { statusColors, statusLabels, type OrderStatus } from '@/types/order';

interface RecentOrdersProps {
  orders: any[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (!orders?.length) {
    return <p className="text-center text-muted-foreground py-4">No recent orders</p>;
  }

  return (
    <div className="space-y-3">
      {orders.slice(0, 5).map((order) => (
        <Link
          key={order.id}
          href="/dashboard/orders"
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
        >
          <div>
            <p className="font-medium">#{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">{order.customer?.name}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatPrice(order.totalAmount)}</p>
            <Badge className={statusColors[order.status as OrderStatus]}>
              {statusLabels[order.status as OrderStatus]}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
