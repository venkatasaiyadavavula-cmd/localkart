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

export function useShop(slug?: string) {
  const queryClient = useQueryClient();
  const isSellerShop = !slug;

  const query = useQuery({
    queryKey: isSellerShop ? ['seller', 'shop'] : ['shop', slug],
    queryFn: async () => {
      if (isSellerShop) {
        const { data } = await apiClient.get('/seller/shop', {
          headers: getAuthHeaders(),
        });
        return data.data;
      }
      const { data } = await apiClient.get(`/seller/shop/slug/${slug}`);
      return data.data;
    },
    enabled: isSellerShop ? !!getAuthHeaders().Authorization : !!slug,
  });

  const updateMutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const { data } = await apiClient.put('/seller/shop', shopData, {
        headers: getAuthHeaders(),
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateShop: updateMutation.mutateAsync,
  };
}
