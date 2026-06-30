import { apiClient } from './client';

export interface CreateOrderData {
  paymentMethod: 'cod' | 'razorpay';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryNotes?: string;
}

export const ordersApi = {
  async createOrder(data: CreateOrderData) {
    const response = await apiClient.post('/orders', data);
    return response.data.data;
  },

  async getMyOrders(page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const response = await apiClient.get(`/orders?${params.toString()}`);
    return response.data.data;
  },

  async getOrderById(id: string) {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data.data;
  },

  async cancelOrder(id: string, reason?: string) {
    const response = await apiClient.put(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  async verifyDeliveryOtp(orderId: string, otp: string) {
    const response = await apiClient.post(`/orders/${orderId}/verify-otp`, { otp });
    return response.data.data;
  },

  async trackOrder(orderNumber: string) {
    const response = await apiClient.get(`/orders/track/${orderNumber}`);
    return response.data.data;
  },

  // Seller order methods
  async getSellerOrders(page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const response = await apiClient.get(`/orders/seller/all?${params.toString()}`);
    return response.data.data;
  },

  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    const response = await apiClient.put(`/orders/seller/${orderId}/status`, { status, notes });
    return response.data.data;
  },
};
