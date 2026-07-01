import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { normalizeList, unwrapApiData } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

export function useAdminDisputes(params: { status?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      const { data } = await apiClient.get(`/returns/admin/all?${searchParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      return normalizeList(data);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, action }: { disputeId: string; action: string }) => {
      if (action === 'refund') {
        return apiClient.post(`/returns/admin/${disputeId}/process-refund`, {}, {
          headers: getAuthHeaders(),
        });
      }
      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
      };
      return apiClient.put(
        `/returns/admin/${disputeId}/status`,
        { status: statusMap[action] || action },
        { headers: getAuthHeaders() },
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
