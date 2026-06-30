import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useAdminDisputes(params: { status?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      const { data } = await apiClient.get(`/admin/disputes?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, action }: { disputeId: string; action: string }) => {
      const token = localStorage.getItem('accessToken');
      return apiClient.put(`/admin/disputes/${disputeId}/resolve`, { action }, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
