import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginated } from '@/lib/utils/api';
import type { Shop } from '@/types/product';

interface AdminShopsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function adminShopsQueryKey(params: AdminShopsParams) {
  return [
    'admin',
    'shops',
    params.status ?? 'all',
    params.search ?? '',
    params.page ?? 1,
    params.limit ?? 20,
  ] as const;
}

export function useAdminShops(params: AdminShopsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminShopsQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('limit', String(params.limit ?? 20));
      if (params.status && params.status !== 'all') {
        searchParams.append('status', params.status);
      }
      if (params.search?.trim()) {
        searchParams.append('search', params.search.trim());
      }

      const endpoint =
        params.status === 'pending'
          ? `/admin/shops/pending?${searchParams.toString()}`
          : `/admin/shops?${searchParams.toString()}`;

      const { data } = await apiClient.get(endpoint);
      return unwrapPaginated<Shop>(data);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (shopId: string) => {
      return apiClient.put(`/admin/shops/${shopId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ shopId, reason }: { shopId: string; reason: string }) => {
      return apiClient.put(`/admin/shops/${shopId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ shopId, reason }: { shopId: string; reason: string }) => {
      return apiClient.put(`/admin/shops/${shopId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (shopId: string) => {
      return apiClient.put(`/admin/shops/${shopId}/unsuspend`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  return {
    data: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    approveShop: (shopId: string) => approveMutation.mutateAsync(shopId),
    rejectShop: (shopId: string, reason: string) =>
      rejectMutation.mutateAsync({ shopId, reason }),
    suspendShop: (shopId: string, reason: string) =>
      suspendMutation.mutateAsync({ shopId, reason }),
    unsuspendShop: (shopId: string) => unsuspendMutation.mutateAsync(shopId),
  };
}
