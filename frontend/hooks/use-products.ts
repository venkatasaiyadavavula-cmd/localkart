import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginated } from '@/lib/utils/api';
import type { Product } from '@/types/product';
import type { PaginationMeta } from '@/lib/utils/api';

export interface ProductsQueryResult {
  data: Product[];
  meta: PaginationMeta;
}

export function useProducts(params: Record<string, unknown> = {}) {
  return useQuery<ProductsQueryResult>({
    queryKey: ['products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/catalog/products?${searchParams.toString()}`);
      return unwrapPaginated<Product>(data);
    },
    placeholderData: keepPreviousData,
    enabled: params.shopId === undefined ? true : Boolean(params.shopId),
  });
}
