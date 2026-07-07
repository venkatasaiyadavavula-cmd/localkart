import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';
import { ordersApi } from '@/lib/api/orders';
import type { Order } from '@/types/order';

export function useSellerOrders(params: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<Order[]>({
    queryKey: ['seller', 'orders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('limit', '100');
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const { data } = await apiClient.get(`/orders/seller/all?${searchParams.toString()}`);
      let orders = normalizeList<Order>(data);
      if (params.search) {
        const q = params.search.toLowerCase();
        orders = orders.filter((o) => o.orderNumber?.toLowerCase().includes(q));
      }
      return orders;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiClient.put(`/orders/seller/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ orderId, otp }: { orderId: string; otp: string }) => {
      return ordersApi.verifyDeliveryOtp(orderId, otp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateOrderStatus: (orderId: string, status: string) =>
      updateStatusMutation.mutateAsync({ orderId, status }),
    verifyOrderOtp: (orderId: string, otp: string) =>
      verifyOtpMutation.mutateAsync({ orderId, otp }),
  };
}
