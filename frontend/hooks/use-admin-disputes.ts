import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList } from '@/lib/utils';
import type { ReturnRequest } from '@/types/order';

export function useAdminDisputes(params: { status?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<ReturnRequest[]>({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      const { data } = await apiClient.get(`/returns/admin/all?${searchParams.toString()}`);
      return normalizeList<ReturnRequest>(data);
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
      return apiClient.put(
        `/returns/admin/${disputeId}/status`,
        { status: statusMap[action] || action },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    resolveDispute: (disputeId: string, action: string) =>
      resolveMutation.mutateAsync({ disputeId, action }),
  };
}
