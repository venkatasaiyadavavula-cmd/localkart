import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export interface NearbyShopsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  categoryType?: string;
  page?: number;
  limit?: number;
}

export const locationApi = {
  /**
   * Check if any shops deliver to given coordinates
   */
  async checkServiceability(lat: number, lng: number, radius: number = 20): Promise<{ serviceable: boolean; shopsCount: number; maxDistance?: number; deliveryCharge?: number }> {
    const { data } = await apiClient.get('/location/check-serviceability', {
      params: { lat, lng, radius },
    });
    return unwrapApiData(data);
  },

  /**
   * Get nearby shops based on coordinates
   */
  async getNearbyShops(params: NearbyShopsParams) {
    const { data } = await apiClient.get('/location/nearby-shops', { params });
    return data;
  },

  /**
   * Search shops by name within radius
   */
  async searchShops(lat: number, lng: number, radius: number, query: string) {
    const { data } = await apiClient.get('/location/search-shops', {
      params: { lat, lng, radius, q: query },
    });
    return data;
  },

  /**
   * Get available cities with shops
   */
  async getAvailableCities() {
    const { data } = await apiClient.get('/location/cities');
    return data;
  },

  /**
   * Get pincodes for a city
   */
  async getPincodesByCity(city: string) {
    const { data } = await apiClient.get('/location/pincodes', { params: { city } });
    return data;
  },
};
