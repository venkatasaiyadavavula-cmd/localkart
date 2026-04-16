import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

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
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const { data } = await apiClient.get(`/admin/products?${searchParams.toString()}`);
      return data.data;
    },
  });
}

export function useApproveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiClient.put(`/admin/products/${productId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useRejectProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason: string }) =>
      apiClient.put(`/admin/products/${productId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}
