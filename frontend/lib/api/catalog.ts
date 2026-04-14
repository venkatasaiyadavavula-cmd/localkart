import { apiClient } from './client';

export interface ProductFilters {
  categoryType?: string;
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  query?: string;
}

export const catalogApi = {
  async getProducts(filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/catalog/products?${params.toString()}`);
    return response.data.data;
  },

  async getProductBySlug(slug: string) {
    const response = await apiClient.get(`/catalog/products/${slug}`);
    return response.data.data;
  },

  async getProductById(id: string) {
    const response = await apiClient.get(`/catalog/products/${id}`);
    return response.data.data;
  },

  async getCategories() {
    const response = await apiClient.get('/catalog/categories');
    return response.data.data;
  },

  async getCategoryBySlug(slug: string) {
    const response = await apiClient.get(`/catalog/categories/${slug}`);
    return response.data.data;
  },

  async searchProducts(query: string, lat?: number, lng?: number) {
    const params = new URLSearchParams({ q: query });
    if (lat && lng) {
      params.append('lat', String(lat));
      params.append('lng', String(lng));
    }
    const response = await apiClient.get(`/catalog/search?${params.toString()}`);
    return response.data.data;
  },

  async getShopProducts(shopId: string, filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/catalog/shop/${shopId}/products?${params.toString()}`);
    return response.data.data;
  },

  async getSponsoredProducts(lat?: number, lng?: number) {
    const params = new URLSearchParams();
    if (lat && lng) {
      params.append('lat', String(lat));
      params.append('lng', String(lng));
    }
    const response = await apiClient.get(`/catalog/sponsored?${params.toString()}`);
    return response.data.data;
  },
};
