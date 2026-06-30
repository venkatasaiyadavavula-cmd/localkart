import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useSellerProducts(params: Record<string, unknown> = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'products', params],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/seller/products?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.delete(`/seller/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data: updateData }: { productId: string; data: Record<string, unknown> }) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/seller/products/${productId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    deleteProduct: deleteMutation.mutateAsync,
    updateProduct: (productId: string, data: Record<string, unknown>) =>
      updateMutation.mutateAsync({ productId, data }),
  };
}
