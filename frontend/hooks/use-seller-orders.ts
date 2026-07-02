import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';

export function useSellerOrders(params: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'orders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const { data } = await apiClient.get(`/orders/seller/all?${searchParams.toString()}`);
      let orders = normalizeList<{ orderNumber?: string }>(data);
      if (params.search) {
        const q = params.search.toLowerCase();
        orders = orders.filter((o: { orderNumber?: string }) =>
          o.orderNumber?.toLowerCase().includes(q),
        );
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
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateOrderStatus: (orderId: string, status: string) =>
      updateStatusMutation.mutateAsync({ orderId, status }),
  };
}
