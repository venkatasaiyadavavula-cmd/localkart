import type { QueryClient } from '@tanstack/react-query';

/** Invalidate all wishlist react-query caches after any toggle. */
export function invalidateWishlistQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['wishlist'] });
}
