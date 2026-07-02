import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

interface ProductsResponse {
  products?: unknown[];
  data?: unknown[];
  total?: number;
}

export function useProducts(params: Record<string, unknown> = {}) {
  return useQuery<ProductsResponse | unknown[]>({
    queryKey: ['products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/catalog/products?${searchParams.toString()}`);
      return unwrapApiData(data);
    },
    placeholderData: keepPreviousData,
  });
}
