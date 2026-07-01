import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { normalizeList, unwrapApiData } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAdCampaigns() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'ads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/ads', {
        headers: getAuthHeaders(),
      });
      const campaigns = normalizeList(unwrapApiData(data));
      return {
        sponsored: campaigns.filter((c: { adType?: string }) => c.adType === 'sponsored' || !c.adType),
        video: campaigns.filter((c: { adType?: string }) => c.adType === 'video'),
        all: campaigns,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (campaignData: Record<string, unknown>) => {
      const { data } = await apiClient.post('/seller/ads', campaignData, {
        headers: getAuthHeaders(),
      });
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiClient.post(`/seller/ads/${campaignId}/pause`, {}, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiClient.post(`/seller/ads/${campaignId}/resume`, {}, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: async (campaignId: string, payload: { status?: string }) => {
      if (payload.status === 'paused' || payload.status === 'active') {
        if (payload.status === 'paused') {
          return pauseMutation.mutateAsync(campaignId);
        }
        return resumeMutation.mutateAsync(campaignId);
      }
      const { data } = await apiClient.put(`/seller/ads/${campaignId}`, payload, {
        headers: getAuthHeaders(),
      });
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
      return unwrapApiData(data);
    },
  };
}
