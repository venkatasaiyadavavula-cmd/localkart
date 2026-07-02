import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

/** Public product by slug (customer catalog) */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/products/${slug}`);
      return unwrapApiData(data);
    },
    enabled: !!slug,
  });
}

/** Seller product by ID (dashboard edit) */
export function useSellerProduct(productId: string) {
  return useQuery({
    queryKey: ['seller-product', productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/seller/products/${productId}`);
      return unwrapApiData(data);
    },
    enabled: !!productId,
  });
}
