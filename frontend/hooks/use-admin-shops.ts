import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useAdminShops(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'shops', params],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const { data } = await apiClient.get(`/admin/shops?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });
}

export function useApproveShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopId: string) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/admin/shops/${shopId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });
}

export function useRejectShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, reason }: { shopId: string; reason: string }) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/admin/shops/${shopId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });
}
