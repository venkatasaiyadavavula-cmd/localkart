import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface ProductsResponse {
  products?: unknown[];
  data?: unknown[];
  total?: number;
}

export function useProducts(params: Record<string, unknown> = {}) {
  return useQuery<ProductsResponse | unknown[]>({
    queryKey: ['products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const { data } = await apiClient.get(`/catalog/products?${searchParams.toString()}`);
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
}
