import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export interface CategoryCommissionRate {
  categoryType: string;
  label: string;
  slug: string;
  rate: number;
}

export function useAdminCommissionRates() {
  const queryClient = useQueryClient();

  const query = useQuery<CategoryCommissionRate[]>({
    queryKey: ['admin', 'commission-rates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/commissions/rates');
      return unwrapApiData<CategoryCommissionRate[]>(data);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ categoryType, rate }: { categoryType: string; rate: number }) => {
      const { data } = await apiClient.put(`/admin/commissions/category/${categoryType}`, {
        rate,
      });
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-rates'] });
    },
  });

  return {
    rates: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    updateRate: (categoryType: string, rate: number) =>
      updateMutation.mutateAsync({ categoryType, rate }),
    isUpdating: updateMutation.isPending,
  };
}
