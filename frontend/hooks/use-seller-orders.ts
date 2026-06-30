import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeOrders(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: unknown[] };
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
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
      return normalizeOrders(data.data);
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
