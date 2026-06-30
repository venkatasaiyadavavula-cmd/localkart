import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useShop(slug: string) {
  return useQuery({
    queryKey: ['shop', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/shops/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}
