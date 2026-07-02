import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export function useShop(slug?: string) {
  const queryClient = useQueryClient();
  const isSellerShop = !slug;

  const query = useQuery({
    queryKey: isSellerShop ? ['seller', 'shop'] : ['shop', slug],
    queryFn: async () => {
      if (isSellerShop) {
        const { data } = await apiClient.get('/seller/shop');
        return unwrapApiData(data);
      }
      const isUuid = /^[0-9a-f-]{36}$/i.test(slug!);
      const endpoint = isUuid ? `/seller/shop/id/${slug}` : `/seller/shop/slug/${slug}`;
      const { data } = await apiClient.get(endpoint);
      return unwrapApiData(data);
    },
    enabled: isSellerShop
      ? typeof window !== 'undefined' && !!localStorage.getItem('accessToken')
      : !!slug,
  });

  const updateMutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const currentShop = queryClient.getQueryData<Record<string, unknown>>(['seller', 'shop']);
      const payload = {
        ...shopData,
        latitude: shopData.latitude ?? currentShop?.latitude ?? 0,
        longitude: shopData.longitude ?? currentShop?.longitude ?? 0,
      };
      const { data } = await apiClient.put('/seller/shop', payload);
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateShop: updateMutation.mutateAsync,
  };
}
