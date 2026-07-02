import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList, unwrapApiData } from '@/lib/utils';

export function useAdCampaigns() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['seller', 'ads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/ads');
      const campaigns = normalizeList<{ adType?: string }>(unwrapApiData(data));
      return {
        sponsored: campaigns.filter((c: { adType?: string }) => c.adType === 'sponsored' || !c.adType),
        video: campaigns.filter((c: { adType?: string }) => c.adType === 'video'),
        all: campaigns,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (campaignData: Record<string, unknown>) => {
      const { data } = await apiClient.post('/seller/ads', campaignData);
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiClient.post(`/seller/ads/${campaignId}/pause`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiClient.post(`/seller/ads/${campaignId}/resume`, {});
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
      const { data } = await apiClient.put(`/seller/ads/${campaignId}`, payload);
      queryClient.invalidateQueries({ queryKey: ['seller', 'ads'] });
      return unwrapApiData(data);
    },
  };
}
