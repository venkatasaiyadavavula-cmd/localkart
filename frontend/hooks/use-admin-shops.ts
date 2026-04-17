import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface AdminShopsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminShops(params: AdminShopsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'shops', params],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
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

export function useSuspendShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopId: string) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/admin/shops/${shopId}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });
}
