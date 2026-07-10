import { APIRequestContext } from '@playwright/test';
import { API, CREDS } from './helpers';

export type ApiLoginResult = { accessToken: string; refreshToken?: string; user: Record<string, unknown> };

export async function apiLogin(
  request: APIRequestContext,
  phone: string,
  password: string,
): Promise<ApiLoginResult> {
  const res = await request.post(`${API}/auth/login`, {
    data: { phone, password },
  });
  if (!res.ok()) {
    throw new Error(`API login failed (${res.status()}): ${await res.text()}`);
  }
  const body = await res.json();
  const data = body.data ?? body;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getCustomerToken(request: APIRequestContext) {
  const { accessToken } = await apiLogin(request, CREDS.customer.phone, CREDS.customer.password);
  return accessToken;
}

export async function getSellerToken(request: APIRequestContext) {
  const { accessToken } = await apiLogin(request, CREDS.seller.phone, CREDS.seller.password);
  return accessToken;
}

export async function getAdminToken(request: APIRequestContext) {
  const { accessToken } = await apiLogin(request, CREDS.admin.phone, CREDS.admin.password);
  return accessToken;
}

export async function staffApiLogin(request: APIRequestContext, staffId: string, password: string) {
  const res = await request.post(`${API}/seller/staff/login`, {
    data: { staffId, password },
  });
  if (!res.ok()) {
    return { ok: false as const, status: res.status(), body: await res.text() };
  }
  const body = await res.json();
  const data = body.data ?? body;
  return { ok: true as const, accessToken: (data.accessToken ?? data.token) as string, staff: data.staff };
}

export async function findLowStockProduct(request: APIRequestContext, maxStock = 3) {
  const res = await request.get(`${API}/catalog/products?limit=50`);
  const body = await res.json();
  const products = body?.data?.products ?? body?.data ?? body?.products ?? [];
  if (!Array.isArray(products)) return undefined;
  return products
    .filter((p: { stock?: number }) => (p.stock ?? 0) > 0)
    .sort((a: { stock?: number }, b: { stock?: number }) => (a.stock ?? 0) - (b.stock ?? 0))
    .find((p: { stock?: number }) => (p.stock ?? 0) <= maxStock);
}

export async function findProductFromOtherShop(request: APIRequestContext, sellerToken: string) {
  const shopRes = await request.get(`${API}/seller/shop`, { headers: authHeaders(sellerToken) });
  const myShop = (await shopRes.json())?.data ?? (await shopRes.json());
  const myShopId = myShop?.id;

  const res = await request.get(`${API}/catalog/products?limit=30`);
  const body = await res.json();
  const products = body?.data?.products ?? body?.data ?? [];
  return products.find((p: { shopId?: string; shop?: { id?: string } }) => {
    const sid = p.shopId ?? p.shop?.id;
    return sid && sid !== myShopId;
  });
}

export async function getCustomerOrders(request: APIRequestContext, token: string) {
  const res = await request.get(`${API}/orders?page=1&limit=10`, { headers: authHeaders(token) });
  const body = await res.json();
  const data = body?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(body?.orders)) return body.orders;
  return [];
}
