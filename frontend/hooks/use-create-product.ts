import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCreateProduct() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await apiClient.post('/catalog/seller/products', payload, {
        headers: getAuthHeaders(),
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });

  return {
    createProduct: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
