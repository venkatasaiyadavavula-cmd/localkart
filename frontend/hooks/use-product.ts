import { useApiQuery } from '@/lib/hooks/use-api-query';
import type { Product } from '@/types/product';

/** Public product by slug (customer catalog) */
export function useProduct(slug: string) {
  return useApiQuery<Product>(['product', slug], `/catalog/products/${slug}`, {
    enabled: !!slug,
  });
}

/** Seller product by ID (dashboard edit) */
export function useSellerProduct(productId: string) {
  return useApiQuery<Product>(
    ['seller-product', productId],
    `/catalog/seller/products/${productId}`,
    { enabled: !!productId },
  );
}
