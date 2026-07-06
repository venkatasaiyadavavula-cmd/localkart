import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeList, unwrapApiData } from '@/lib/utils';
import type { FeaturedVideo } from '@/types/api';

export function useFeaturedVideos() {
  const queryClient = useQueryClient();

  const query = useQuery<FeaturedVideo[]>({
    queryKey: ['seller', 'featured-videos'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/featured-videos');
      return normalizeList<FeaturedVideo>(unwrapApiData(data));
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await apiClient.post('/seller/featured-videos', { productId });
      return unwrapApiData<{ message?: string }>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'featured-videos'] });
      queryClient.invalidateQueries({ queryKey: ['home-featured-videos'] });
    },
  });

  return {
    featuredVideos: query.data,
    isLoading: query.isLoading,
    promoteVideo: promoteMutation.mutateAsync,
    isPromoting: promoteMutation.isPending,
  };
}
