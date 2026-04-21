import { apiClient } from './client';

export const sellerApi = {
  // Shop
  async getMyShop() {
    const response = await apiClient.get('/seller/shop');
    return response.data.data;
  },

  async createShop(data: any) {
    const response = await apiClient.post('/seller/shop', data);
    return response.data.data;
  },

  async updateShop(data: any) {
    const response = await apiClient.put('/seller/shop', data);
    return response.data.data;
  },

  async getShopBySlug(slug: string) {
    const response = await apiClient.get(`/shops/${slug}`);
    return response.data.data;
  },

  // Products (seller)
  async getSellerProducts(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/seller/products?${params.toString()}`);
    return response.data.data;
  },

  async createProduct(data: FormData) {
    const response = await apiClient.post('/seller/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async updateProduct(id: string, data: FormData) {
    const response = await apiClient.put(`/seller/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async deleteProduct(id: string) {
    const response = await apiClient.delete(`/seller/products/${id}`);
    return response.data.data;
  },

  // Dashboard
  async getDashboardStats(period = 'week') {
    const response = await apiClient.get(`/seller/dashboard?period=${period}`);
    return response.data.data;
  },

  async getSalesChart(period = 'week') {
    const response = await apiClient.get(`/seller/dashboard/sales-chart?period=${period}`);
    return response.data.data;
  },

  // Subscription
  async getCurrentSubscription() {
    const response = await apiClient.get('/seller/subscription');
    return response.data.data;
  },

  async getAvailablePlans() {
    const response = await apiClient.get('/seller/subscription/plans');
    return response.data.data;
  },

  async subscribe(plan: string, autoRenew = false) {
    const response = await apiClient.post('/seller/subscription/subscribe', { plan, autoRenew });
    return response.data.data;
  },

  async cancelSubscription() {
    const response = await apiClient.post('/seller/subscription/cancel');
    return response.data.data;
  },

  // Earnings
  async getEarnings(period?: string) {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get(`/seller/earnings${params}`);
    return response.data.data;
  },

  async getEarningsTransactions(page = 1, limit = 20) {
    const response = await apiClient.get(`/seller/earnings/transactions?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Ads
  async getAdCampaigns() {
    const response = await apiClient.get('/seller/ads');
    return response.data.data;
  },

  async createAdCampaign(data: any) {
    const response = await apiClient.post('/seller/ads', data);
    return response.data.data;
  },

  async updateAdCampaign(id: string, data: any) {
    const response = await apiClient.put(`/seller/ads/${id}`, data);
    return response.data.data;
  },

  async pauseAdCampaign(id: string) {
    const response = await apiClient.post(`/seller/ads/${id}/pause`);
    return response.data.data;
  },

  async resumeAdCampaign(id: string) {
    const response = await apiClient.post(`/seller/ads/${id}/resume`);
    return response.data.data;
  },
};
