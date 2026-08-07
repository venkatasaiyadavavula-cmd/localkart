import type { APIRequestContext } from '@playwright/test';
import { API } from '../helpers';
import {
  apiLogin,
  authHeaders,
  getCustomerOrders,
  getCustomerToken,
  getSellerToken,
} from '../api-helpers';
import type { AppRoute } from './discover-routes';

export interface DynamicRouteContext {
  categories: string[];
  productDetailPath?: string;
  shopPath?: string;
  orderDetailPath?: string;
  returnPath?: string;
  trackPath?: string;
  sellerProductEditPath?: string;
}

function qaHeaders(): Record<string, string> {
  const token = process.env.QA_THROTTLE_BYPASS_TOKEN;
  return token ? { 'X-QA-Throttle-Bypass': token } : {};
}

export async function fetchDynamicRouteContext(request: APIRequestContext): Promise<DynamicRouteContext> {
  const headers = qaHeaders();

  const catRes = await request.get(`${API}/catalog/categories`, { headers });
  let categories: string[] = [];
  if (catRes.ok()) {
    const body = await catRes.json();
    const list = body?.data ?? body ?? [];
    if (Array.isArray(list)) {
      categories = list
        .map((c: { slug?: string; type?: string; name?: string }) => c.slug || c.type || c.name)
        .filter(Boolean);
    }
  }
  if (categories.length === 0) {
    categories = ['groceries', 'fashion', 'electronics', 'beauty', 'home_essentials', 'accessories'];
  }

  const prodRes = await request.get(`${API}/catalog/products?limit=20`, { headers });
  const prodBody = await prodRes.json();
  const products = prodBody?.data?.products ?? prodBody?.data ?? [];

  const product = Array.isArray(products) ? products.find((p: { slug?: string }) => p.slug) : undefined;
  const productDetailPath =
    product?.slug && (product.categoryType || product.category)
      ? `/browse/${product.categoryType || product.category}/product/${product.slug}`
      : undefined;

  const shopSlug = Array.isArray(products)
    ? products.find((p: { shop?: { slug?: string } }) => p.shop?.slug)?.shop?.slug
    : undefined;
  const shopPath = shopSlug ? `/shop/${shopSlug}` : undefined;

  let orderDetailPath: string | undefined;
  let returnPath: string | undefined;
  let trackPath: string | undefined;
  try {
    const token = await getCustomerToken(request);
    const orders = await getCustomerOrders(request, token);
    const order = orders[0];
    if (order?.id) {
      orderDetailPath = `/orders/${order.id}`;
      trackPath = `/orders/track?id=${order.id}`;
    }
    const delivered = orders.find((o: { status?: string }) => o.status === 'delivered');
    if (delivered?.id) returnPath = `/returns/${delivered.id}`;
  } catch {
    /* customer orders optional */
  }

  let sellerProductEditPath: string | undefined;
  try {
    const sellerToken = await getSellerToken(request);
    const spRes = await request.get(`${API}/catalog/seller/products?limit=5`, {
      headers: { ...authHeaders(sellerToken), ...qaHeaders() },
    });
    if (spRes.ok()) {
      const spBody = await spRes.json();
      const sellerProducts = spBody?.data?.products ?? spBody?.data ?? spBody?.products ?? [];
      const sp = Array.isArray(sellerProducts) ? sellerProducts[0] : undefined;
      if (sp?.id) sellerProductEditPath = `/dashboard/products/${sp.id}`;
    }
  } catch {
    /* seller products optional */
  }

  return {
    categories,
    productDetailPath,
    shopPath,
    orderDetailPath,
    returnPath,
    trackPath,
    sellerProductEditPath,
  };
}

export function expandDynamicRoutes(ctx: DynamicRouteContext): AppRoute[] {
  const routes: AppRoute[] = [];

  for (const category of ctx.categories) {
    routes.push({
      template: '/browse/[category]',
      path: `/browse/${category}`,
      role: 'public',
    });
  }

  if (ctx.productDetailPath) {
    routes.push({
      template: '/browse/[category]/product/[slug]',
      path: ctx.productDetailPath,
      role: 'public',
    });
  }

  if (ctx.shopPath) {
    routes.push({ template: '/shop/[slug]', path: ctx.shopPath, role: 'public' });
  }

  if (ctx.orderDetailPath) {
    routes.push({
      template: '/orders/[id]',
      path: ctx.orderDetailPath,
      role: 'customer',
    });
  }

  if (ctx.returnPath) {
    routes.push({
      template: '/returns/[orderId]',
      path: ctx.returnPath,
      role: 'customer',
    });
  }

  if (ctx.trackPath) {
    routes.push({
      template: '/orders/track?id=…',
      path: ctx.trackPath,
      role: 'customer',
    });
  } else {
    routes.push({
      template: '/orders/track',
      path: '/orders/track',
      role: 'public',
    });
  }

  if (ctx.sellerProductEditPath) {
    routes.push({
      template: '/dashboard/products/[id]',
      path: ctx.sellerProductEditPath,
      role: 'seller',
    });
  }

  return routes;
}
