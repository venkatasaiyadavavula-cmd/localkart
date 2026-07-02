import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export function useSponsoredProducts() {
  return useQuery({
    queryKey: ['sponsored-products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/catalog/sponsored');
      const payload = unwrapApiData<unknown[] | { products?: unknown[] }>(data);
      if (Array.isArray(payload)) return payload;
      return payload?.products ?? [];
    },
  });
}
