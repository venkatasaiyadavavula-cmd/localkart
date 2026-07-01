import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { normalizeList } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

export function useAdminShops(params: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'shops', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      const endpoint =
        params.status === 'pending'
          ? `/admin/shops/pending?${searchParams.toString()}`
          : `/admin/shops?${searchParams.toString()}`;
      const { data } = await apiClient.get(endpoint, {
        headers: getAuthHeaders(),
      });
      let shops = normalizeList(data);
      if (params.search) {
        const q = params.search.toLowerCase();
        shops = shops.filter(
          (s: { name?: string; city?: string }) =>
            s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q),
        );
      }
      return shops;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (shopId: string) => {
      return apiClient.put(`/admin/shops/${shopId}/approve`, {}, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ shopId, reason }: { shopId: string; reason: string }) => {
      return apiClient.put(`/admin/shops/${shopId}/reject`, { reason }, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ shopId, reason }: { shopId: string; reason: string }) => {
      return apiClient.put(`/admin/shops/${shopId}/suspend`, { reason }, {
        headers: getAuthHeaders(),
      });
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
  };
}
