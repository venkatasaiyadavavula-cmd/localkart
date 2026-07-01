import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

import { unwrapApiData } from '@/lib/utils';

export function useSponsoredProducts() {
  return useQuery({
    queryKey: ['sponsored-products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/catalog/sponsored');
      const payload = unwrapApiData<unknown[] | { products?: unknown[] }>(data);
      if (Array.isArray(payload)) return payload;
      return payload?.products ?? [];
    },
  });
}
