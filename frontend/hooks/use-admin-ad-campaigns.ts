import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export interface AdminAdCampaignRow {
  id: string;
  kind: 'sponsored' | 'featured_video';
  shopId: string;
  shopName: string;
  productId: string;
  productName: string;
  adType: string;
  status: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  chargeRecorded: boolean;
  chargeAmount: number | null;
  chargeBilled: boolean;
  createdAt: string;
}

interface AdminAdCampaignsResponse {
  data: AdminAdCampaignRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useAdminAdCampaigns(page = 1, limit = 30) {
  const queryClient = useQueryClient();

  const query = useQuery<AdminAdCampaignsResponse>({
    queryKey: ['admin', 'ad-campaigns', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/admin/ad-campaigns?page=${page}&limit=${limit}`,
      );
      return unwrapApiData<AdminAdCampaignsResponse>(data);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data } = await apiClient.post(`/admin/ad-campaigns/${campaignId}/pause`);
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ad-campaigns'] });
    },
  });

  return {
    campaigns: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    pauseCampaign: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,
  };
}
