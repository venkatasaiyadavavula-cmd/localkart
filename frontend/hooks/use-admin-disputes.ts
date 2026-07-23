import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginated } from '@/lib/utils/api';
import type { ReturnRequest } from '@/types/order';

interface AdminDisputesParams {
  status?: string;
  page?: number;
  limit?: number;
}

function adminDisputesQueryKey(params: AdminDisputesParams) {
  return [
    'admin',
    'disputes',
    params.status && params.status !== 'all' ? params.status : 'all',
    params.page ?? 1,
    params.limit ?? 20,
  ] as const;
}

export function useAdminDisputes(params: AdminDisputesParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminDisputesQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('limit', String(params.limit ?? 20));
      if (params.status && params.status !== 'all') {
        searchParams.append('status', params.status);
      }

      const { data } = await apiClient.get(
        `/returns/admin/all?${searchParams.toString()}`,
      );
      return unwrapPaginated<ReturnRequest>(data);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, action }: { disputeId: string; action: string }) => {
      if (action === 'refund') {
        return apiClient.post(`/returns/admin/${disputeId}/process-refund`, {});
      }
      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
      };
      return apiClient.put(`/returns/admin/${disputeId}/status`, {
        status: statusMap[action] || action,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });

  return {
    data: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    resolveDispute: (disputeId: string, action: string) =>
      resolveMutation.mutateAsync({ disputeId, action }),
  };
}
