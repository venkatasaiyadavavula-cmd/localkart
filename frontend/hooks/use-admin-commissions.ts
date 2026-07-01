import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { unwrapApiData } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

export function useAdminCommissions(period: 'week' | 'month' | 'year' = 'month') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'commissions', period],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/commissions/summary?period=${period}`, {
        headers: getAuthHeaders(),
      });
      return unwrapApiData(data);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ categoryType, rate }: { categoryType: string; rate: number }) => {
      const { data } = await apiClient.put(
        `/admin/commissions/category/${categoryType}`,
        { rate },
        { headers: getAuthHeaders() },
      );
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
    },
  });

  const settleMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const { data } = await apiClient.post(
        `/admin/commissions/settle/${shopId}`,
        {},
        { headers: getAuthHeaders() },
      );
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateCommissionRate: (categoryType: string, rate: number) =>
      updateRateMutation.mutateAsync({ categoryType, rate }),
    settleShopEarnings: (shopId: string) => settleMutation.mutateAsync(shopId),
  };
}
