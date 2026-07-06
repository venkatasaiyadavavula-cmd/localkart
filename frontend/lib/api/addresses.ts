import { apiClient } from './client';
import { unwrapApiData } from '@/lib/utils';

export interface SaveAddressPayload {
  type?: string;
  label?: string;
  fullAddress: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export const addressesApi = {
  async list() {
    const { data } = await apiClient.get('/addresses');
    return unwrapApiData<any[]>(data) ?? [];
  },

  async create(payload: SaveAddressPayload) {
    const { data } = await apiClient.post('/addresses', payload);
    return unwrapApiData(data);
  },
};
