import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';
import type { Shop } from '@/types/product';

function adminShopsQueryKey(params: { status?: string; search?: string }) {
  return ['admin', 'shops', params.status ?? 'all', params.search ?? ''] as const;
}

export function useAdminShops(params: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<Shop[]>({
    queryKey: adminShopsQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const endpoint =
        params.status === 'pending'
          ? `/admin/shops/pending?${searchParams.toString()}`
          : `/admin/shops?${searchParams.toString()}`;
      const { data } = await apiClient.get(endpoint);
      let shops = normalizeList<Shop>(data);
      if (params.search) {
        const q = params.search.toLowerCase();
        shops = shops.filter(
          (s) => s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q),
        );
      }
      return shops;
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
    data: query.data,
    isLoading: query.isLoading,
    approveShop: (shopId: string) => approveMutation.mutateAsync(shopId),
    rejectShop: (shopId: string, reason: string) =>
      rejectMutation.mutateAsync({ shopId, reason }),
    suspendShop: (shopId: string, reason: string) =>
      suspendMutation.mutateAsync({ shopId, reason }),
    unsuspendShop: (shopId: string) => unsuspendMutation.mutateAsync(shopId),
  };
}
