import { useApiQuery } from '@/lib/hooks/use-api-query';
import type { Order } from '@/types/order';

export function useOrder(orderId: string) {
  return useApiQuery<Order>(['order', orderId], `/orders/${orderId}`, {
    enabled: !!orderId,
  });
}
