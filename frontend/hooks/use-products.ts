import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import type { Product } from '@/types/product';
import type { ProductsListResponse } from '@/types/api';

export function useProducts(params: Record<string, unknown> = {}) {
  return useQuery<ProductsListResponse | Product[]>({
    queryKey: ['products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/catalog/products?${searchParams.toString()}`);
      return unwrapApiData<ProductsListResponse | Product[]>(data);
    },
    placeholderData: keepPreviousData,
  });
}
