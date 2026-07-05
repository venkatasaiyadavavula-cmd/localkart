export function getProductUrl(product: {
  slug?: string | null;
  categoryType?: string | null;
}): string {
  if (product.slug && product.categoryType) {
    return `/browse/${product.categoryType}/product/${product.slug}`;
  }
  return '/browse';
}
