export function getProductUrl(product: {
  slug?: string;
  categoryType?: string;
}): string {
  if (product.slug && product.categoryType) {
    return `/browse/${product.categoryType}/product/${product.slug}`;
  }
  return '/browse';
}
