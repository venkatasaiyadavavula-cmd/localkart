import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localkart.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const STATIC_ROUTES = [
  '',
  '/browse',
  '/about',
  '/terms',
  '/privacy',
  '/videos',
  '/login',
  '/register',
];

const CATEGORIES = [
  'groceries',
  'fashion',
  'electronics',
  'beauty',
  'home_essentials',
  'accessories',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${BASE_URL}/browse/${category}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const response = await fetch(`${API_URL}/catalog/products?limit=500`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const json = await response.json();
      const products = json?.data?.items ?? json?.data ?? json?.items ?? [];

      if (Array.isArray(products)) {
        productEntries = products
          .filter((p: { slug?: string; categoryType?: string }) => p.slug && p.categoryType)
          .map((product: { slug: string; categoryType: string; updatedAt?: string }) => ({
            url: `${BASE_URL}/browse/${product.categoryType}/product/${product.slug}`,
            lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          }));
      }
    }
  } catch {
    // Sitemap still works with static + category routes
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
