import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useShop(slug?: string) {
  const queryClient = useQueryClient();
  const isSellerShop = !slug;

  const query = useQuery({
    queryKey: isSellerShop ? ['seller', 'shop'] : ['shop', slug],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (isSellerShop) {
        const { data } = await apiClient.get('/seller/shop', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return data.data;
      }
      const { data } = await apiClient.get(`/shops/${slug}`);
      return data.data;
    },
    enabled: isSellerShop ? !!tokenAvailable() : !!slug,
  });

  const updateMutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.put('/seller/shop', shopData, {
        headers: { Authorization: `Bearer ${token}` },
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

function tokenAvailable() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}
