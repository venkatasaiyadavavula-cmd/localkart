import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useSellerOrders(params: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'orders', params],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const { data } = await apiClient.get(`/seller/orders?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/seller/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
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
