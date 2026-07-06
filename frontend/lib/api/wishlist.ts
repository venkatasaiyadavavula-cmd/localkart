import { apiClient } from './client';
import { unwrapApiData } from '@/lib/utils';

export const wishlistApi = {
  async getProductIds(): Promise<string[]> {
    const { data } = await apiClient.get('/wishlist/ids');
    return unwrapApiData<string[]>(data) ?? [];
  },

  async toggle(productId: string): Promise<{ added: boolean }> {
    const { data } = await apiClient.post('/wishlist/toggle', { productId });
    return unwrapApiData<{ added: boolean }>(data);
  },
};
