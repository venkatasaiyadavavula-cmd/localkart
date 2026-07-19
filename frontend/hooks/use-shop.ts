import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData, fetchApiDataOrNull } from '@/lib/utils';
import type { ManualOverride, OperatingHours } from '@/types/shop-hours';
import type { ShopData } from '@/types/api';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function useShop(slugOrId?: string, options?: { sellerShop?: boolean }) {
  const queryClient = useQueryClient();
  const isSellerShop = options?.sellerShop === true;

  const query = useQuery<ShopData | null>({
    queryKey: isSellerShop ? ['seller', 'shop'] : isUuid(slugOrId!) ? ['shop', 'id', slugOrId] : ['shop', slugOrId],
    queryFn: async () => {
      if (isSellerShop) {
        const { data } = await apiClient.get('/seller/shop');
        return unwrapApiData<ShopData>(data);
      }
      const endpoint = isUuid(slugOrId!)
        ? `/seller/shop/id/${slugOrId}`
        : `/seller/shop/slug/${slugOrId}`;
      return fetchApiDataOrNull<ShopData>(endpoint);
    },
    enabled: isSellerShop
      ? typeof window !== 'undefined' && !!localStorage.getItem('accessToken')
      : !!slugOrId,
  });

  const updateMutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const currentShop = queryClient.getQueryData<ShopData>(['seller', 'shop']);
      const payload = {
        ...shopData,
        latitude: shopData.latitude ?? currentShop?.latitude ?? 0,
        longitude: shopData.longitude ?? currentShop?.longitude ?? 0,
      };
      const { data } = await apiClient.put('/seller/shop', payload);
      return unwrapApiData<ShopData>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
    },
  });

  const updateHoursMutation = useMutation({
    mutationFn: async (hours: OperatingHours) => {
      const { data } = await apiClient.put('/seller/shop/hours', hours);
      return unwrapApiData<ShopData>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (manualOverride: ManualOverride) => {
      const { data } = await apiClient.put('/seller/shop/toggle', { manualOverride });
      return unwrapApiData<ShopData>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    updateShop: updateMutation.mutateAsync,
    updateHours: updateHoursMutation.mutateAsync,
    toggleShop: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    isSavingHours: updateHoursMutation.isPending,
  };
}
