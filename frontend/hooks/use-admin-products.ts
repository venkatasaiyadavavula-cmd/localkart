import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';
import type { Product } from '@/types/product';

interface AdminProductsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function adminProductsQueryKey(params: AdminProductsParams) {
  const status = params.status && params.status !== 'all' ? params.status : 'all';
  return [
    'admin',
    'products',
    status,
    params.search ?? '',
    params.page ?? null,
    params.limit ?? null,
  ] as const;
}

export function useAdminProducts(params: AdminProductsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<Product[]>({
    queryKey: adminProductsQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      const status = params.status && params.status !== 'all' ? params.status : 'all';
      searchParams.set('status', status);
      if (params.page !== undefined) searchParams.set('page', String(params.page));
      if (params.limit !== undefined) searchParams.set('limit', String(params.limit));

      const { data } = await apiClient.get(`/admin/products?${searchParams.toString()}`);
      let products = normalizeList<Product>(data);

      if (params.search) {
        const q = params.search.toLowerCase();
        products = products.filter((p) => p.name?.toLowerCase().includes(q));
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
