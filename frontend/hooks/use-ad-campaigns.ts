import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useAdCampaigns() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'ads'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.get('/seller/ads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (campaignData: Record<string, unknown>) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.post('/seller/ads', campaignData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ campaignId, data: updateData }: { campaignId: string; data: Record<string, unknown> }) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.put(`/seller/ads/${campaignId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: (campaignId: string, data: Record<string, unknown>) =>
      updateMutation.mutateAsync({ campaignId, data }),
  };
}
