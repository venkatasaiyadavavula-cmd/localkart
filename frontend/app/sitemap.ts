import type { MetadataRoute } from 'next';

import { API_URL } from '@/lib/api-config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localkart.store';

const STATIC_ROUTES = [
  '',
  '/browse',
  '/about',
  '/terms',
  '/privacy',
  '/videos',
];

const CATEGORIES = [
  'groceries',
  'fashion',
  'electronics',
  'beauty',
  'home_essentials',
  'accessories',
];

const KADAPA_LAT = 14.4673;
const KADAPA_LNG = 78.8242;
const PAGE_LIMIT = 100;

type ProductSitemapItem = {
  slug: string;
  categoryType: string;
  updatedAt?: string;
  shop?: { slug?: string };
};

type ShopSitemapItem = {
  slug: string;
  updatedAt?: string;
};

async function fetchAllProducts(): Promise<ProductSitemapItem[]> {
  const products: ProductSitemapItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetch(
      `${API_URL}/catalog/products?limit=${PAGE_LIMIT}&page=${page}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) break;

    const json = await response.json();
    const batch = json?.data ?? [];
    const meta = json?.meta ?? {};

    if (Array.isArray(batch) && batch.length > 0) {
      products.push(...batch);
    }

    totalPages = meta.totalPages ?? 1;
    if (!Array.isArray(batch) || batch.length === 0) break;
    page += 1;
  }

  return products;
}

async function fetchAllShops(): Promise<ShopSitemapItem[]> {
  const shops: ShopSitemapItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetch(
      `${API_URL}/location/nearby-shops?latitude=${KADAPA_LAT}&longitude=${KADAPA_LNG}&radius=50&limit=${PAGE_LIMIT}&page=${page}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) break;

    const json = await response.json();
    const batch = json?.data ?? [];
    const meta = json?.meta ?? {};

    if (Array.isArray(batch) && batch.length > 0) {
      shops.push(...batch);
    }

    totalPages = meta.totalPages ?? 1;
    if (!Array.isArray(batch) || batch.length === 0) break;
    page += 1;
  }

  return shops;
}

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
  let shopEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await fetchAllProducts();

    productEntries = products
      .filter((p) => p.slug && p.categoryType)
      .map((product) => ({
        url: `${BASE_URL}/browse/${product.categoryType}/product/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

    const shopSlugsFromProducts = new Set(
      products.map((p) => p.shop?.slug).filter((slug): slug is string => !!slug),
    );

    const nearbyShops = await fetchAllShops();
    const allShopSlugs = new Set([
      ...shopSlugsFromProducts,
      ...nearbyShops.map((s) => s.slug).filter(Boolean),
    ]);

    shopEntries = [...allShopSlugs].map((slug) => ({
      url: `${BASE_URL}/shop/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap still works with static + category routes
  }

  return [...staticEntries, ...categoryEntries, ...shopEntries, ...productEntries];
}
