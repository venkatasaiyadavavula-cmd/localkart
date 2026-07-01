import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { unwrapApiData } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useSubscription() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'subscription'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.get('/seller/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return unwrapApiData(data);
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.post('/seller/subscription/subscribe', { plan }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'subscription'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    subscribe: subscribeMutation.mutateAsync,
  };
}
