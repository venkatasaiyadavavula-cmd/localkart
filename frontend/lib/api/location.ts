// frontend/lib/api/location.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
  async checkServiceability(lat: number, lng: number, radius: number = 20): Promise<{ serviceable: boolean; shopsCount: number }> {
    const { data } = await apiClient.get('/location/check-serviceability', {
      params: { lat, lng, radius },
    });
    return data;
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
