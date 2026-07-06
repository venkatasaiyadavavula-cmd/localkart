import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';
import type { Product } from '@/types/product';

export function useSellerProducts(params: Record<string, unknown> = {}) {
  const queryClient = useQueryClient();
  const queryParams = { limit: 100, ...params };

  const query = useQuery<Product[]>({
    queryKey: ['seller', 'products', queryParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/catalog/seller/products?${searchParams.toString()}`);
      return normalizeList<Product>(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiClient.delete(`/catalog/seller/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data: updateData }: { productId: string; data: Record<string, unknown> }) => {
      return apiClient.put(`/catalog/seller/products/${productId}`, updateData);
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
