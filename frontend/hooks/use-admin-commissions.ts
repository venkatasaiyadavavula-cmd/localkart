import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import type { AdminCommissionsSummary } from '@/types/api';

export function useAdminCommissions(period: 'week' | 'month' | 'year' = 'month') {
  const queryClient = useQueryClient();

  const query = useQuery<AdminCommissionsSummary>({
    queryKey: ['admin', 'commissions', period],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/commissions/summary?period=${period}`);
      return unwrapApiData<AdminCommissionsSummary>(data);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ categoryType, rate }: { categoryType: string; rate: number }) => {
      const { data } = await apiClient.put(
        `/admin/commissions/category/${categoryType}`,
        { rate },
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
