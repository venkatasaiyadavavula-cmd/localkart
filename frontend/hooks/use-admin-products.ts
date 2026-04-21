import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface AdminProductsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminProducts(params: AdminProductsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const { data } = await apiClient.get(`/admin/products?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });
}

export function useApproveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/admin/products/${productId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useRejectProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/admin/products/${productId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}
