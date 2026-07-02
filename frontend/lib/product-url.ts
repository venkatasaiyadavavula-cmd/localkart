/**
 * Build canonical product detail URLs: /browse/[category]/product/[slug]
 */
export function getProductUrl(product: {
  slug?: string | null;
  categoryType?: string | null;
  productId?: string | null;
  id?: string | null;
}): string {
  const slug = product.slug;
  const category = product.categoryType;

  if (slug && category) {
    return `/browse/${category}/product/${slug}`;
  }

  return '/browse';
}
