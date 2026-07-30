import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginated } from '@/lib/utils/api';
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
    params.page ?? 1,
    params.limit ?? 20,
  ] as const;
}

export function useAdminProducts(params: AdminProductsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminProductsQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      const status = params.status && params.status !== 'all' ? params.status : 'all';
      searchParams.set('status', status);
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('limit', String(params.limit ?? 20));
      if (params.search?.trim()) {
        searchParams.set('search', params.search.trim());
      }

      const { data } = await apiClient.get(`/admin/products?${searchParams.toString()}`);
      return unwrapPaginated<Product>(data);
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
    data: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    approveProduct: (productId: string) => approveMutation.mutateAsync(productId),
    rejectProduct: (productId: string, reason: string) =>
      rejectMutation.mutateAsync({ productId, reason }),
  };
}
