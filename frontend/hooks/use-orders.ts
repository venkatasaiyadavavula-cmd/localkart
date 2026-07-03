import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';

export function useOrders(params: { status?: string } = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('limit', '100');
      if (params.status) searchParams.append('status', params.status);
      const { data } = await apiClient.get(`/orders?${searchParams.toString()}`);
      return normalizeList(data);
    },
  });
}
