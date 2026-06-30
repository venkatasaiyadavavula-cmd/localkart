import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Public product by slug (customer catalog) */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/products/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

/** Seller product by ID (dashboard edit) */
export function useSellerProduct(productId: string) {
  return useQuery({
    queryKey: ['seller-product', productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/seller/products/${productId}`, {
        headers: getAuthHeaders(),
      });
      return data.data;
    },
    enabled: !!productId,
  });
}
