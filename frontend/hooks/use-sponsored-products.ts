import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import type { Product } from '@/types/product';

export function useSponsoredProducts() {
  return useQuery<Product[]>({
    queryKey: ['sponsored-products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/catalog/sponsored');
      const payload = unwrapApiData<Product[] | { products?: Product[] }>(data);
      if (Array.isArray(payload)) return payload;
      return payload?.products ?? [];
    },
  });
}
