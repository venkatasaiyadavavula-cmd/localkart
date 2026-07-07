import axios from 'axios';
import { staffAuthHeaders } from '@/hooks/use-staff-auth';
import { unwrapApiData } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function staffClient() {
  return axios.create({
    baseURL: API,
    headers: staffAuthHeaders(),
  });
}

export const staffWorkApi = {
  async getProfile() {
    const { data } = await staffClient().get('/staff/work/me');
    return unwrapApiData(data);
  },

  async getProducts(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    const { data } = await staffClient().get(`/staff/work/products?${qs}`);
    return unwrapApiData(data);
  },

  async createProduct(body: Record<string, unknown>) {
    const { data } = await staffClient().post('/staff/work/products', body);
    return unwrapApiData(data);
  },

  async updateProduct(id: string, body: Record<string, unknown>) {
    const { data } = await staffClient().put(`/staff/work/products/${id}`, body);
    return unwrapApiData(data);
  },

  async getOrders(page = 1, status?: string) {
    const qs = new URLSearchParams({ page: String(page), limit: '100' });
    if (status) qs.append('status', status);
    const { data } = await staffClient().get(`/staff/work/orders?${qs}`);
    return unwrapApiData(data);
  },

  async updateOrderStatus(orderId: string, status: string) {
    const { data } = await staffClient().put(`/staff/work/orders/${orderId}/status`, { status });
    return unwrapApiData(data);
  },

  async updateDeliveryLocation(
    orderId: string,
    body: { latitude: number; longitude: number; staffName?: string; staffPhone?: string },
  ) {
    const { data } = await staffClient().put(`/staff/work/orders/${orderId}/location`, body);
    return unwrapApiData(data);
  },
};
