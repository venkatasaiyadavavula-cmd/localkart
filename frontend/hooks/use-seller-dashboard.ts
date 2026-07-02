import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export function useSellerDashboard(period: 'week' | 'month' | 'year' = 'week') {
  return useQuery({
    queryKey: ['seller', 'dashboard', period],
    queryFn: async () => {
      const { data } = await apiClient.get(`/seller/dashboard?period=${period}`);
      return unwrapApiData(data);
    },
  });
}
