import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';

interface AdminProductsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminProducts(params: AdminProductsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const endpoint =
        !params.status || params.status === 'pending'
          ? `/admin/products/pending?${searchParams.toString()}`
          : `/admin/products/pending?limit=0`;
      const { data } = await apiClient.get(endpoint);
      const products = normalizeList<{ status?: string; name?: string }>(data);
      if (params.status && params.status !== 'pending' && params.status !== 'all') {
        return products.filter((p: { status?: string }) => p.status === params.status);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        return products.filter((p: { name?: string }) => p.name?.toLowerCase().includes(q));
      }
      return products;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiClient.put(`/admin/products/${productId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      return apiClient.put(`/admin/products/${productId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    approveProduct: (productId: string) => approveMutation.mutateAsync(productId),
    rejectProduct: (productId: string, reason: string) =>
      rejectMutation.mutateAsync({ productId, reason }),
  };
}
