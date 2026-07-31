import { apiClient } from './client';
import { unwrapApiData } from '@/lib/utils';

export const productLikesApi = {
  async getProductIds(): Promise<string[]> {
    const { data } = await apiClient.get('/catalog/likes/ids');
    return unwrapApiData<string[]>(data) ?? [];
  },

  async toggle(productId: string): Promise<{ liked: boolean }> {
    const { data } = await apiClient.post(`/catalog/products/${productId}/like`);
    return unwrapApiData<{ liked: boolean }>(data);
  },
};
