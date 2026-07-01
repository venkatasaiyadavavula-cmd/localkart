import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { normalizeList } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useSellerOrders(params: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'orders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const { data } = await apiClient.get(`/orders/seller/all?${searchParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      let orders = normalizeList(data);
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
      return apiClient.put(`/orders/seller/${orderId}/status`, { status }, {
        headers: getAuthHeaders(),
      });
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
