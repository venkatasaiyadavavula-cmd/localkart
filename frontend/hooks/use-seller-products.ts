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

/** Normalize paginated API payloads: { data: T[], meta } or bare array */
export function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: T[] };
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

export function useSellerProducts(params: Record<string, unknown> = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/catalog/seller/products?${searchParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      return normalizeList(data.data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiClient.delete(`/catalog/seller/products/${productId}`, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data: updateData }: { productId: string; data: Record<string, unknown> }) => {
      return apiClient.put(`/catalog/seller/products/${productId}`, updateData, {
        headers: getAuthHeaders(),
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
