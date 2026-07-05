import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ManualOverride, OperatingHours } from '@/types/shop-hours';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function useShop(slugOrId?: string) {
  const queryClient = useQueryClient();
  const isSellerShop = !slugOrId;

  const query = useQuery({
    queryKey: isSellerShop ? ['seller', 'shop'] : isUuid(slugOrId!) ? ['shop', 'id', slugOrId] : ['shop', slugOrId],
    queryFn: async () => {
      if (isSellerShop) {
        const { data } = await apiClient.get('/seller/shop', {
          headers: getAuthHeaders(),
        });
        return data.data;
      }
      const endpoint = isUuid(slugOrId!)
        ? `/seller/shop/id/${slugOrId}`
        : `/seller/shop/slug/${slugOrId}`;
      const { data } = await apiClient.get(endpoint);
      return data.data;
    },
    enabled: isSellerShop ? !!getAuthHeaders().Authorization : !!slugOrId,
  });

  const updateMutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const { data } = await apiClient.put('/seller/shop', shopData, {
        headers: getAuthHeaders(),
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
    },
  });

  const updateHoursMutation = useMutation({
    mutationFn: async (hours: OperatingHours) => {
      const { data } = await apiClient.put('/seller/shop/hours', hours, {
        headers: getAuthHeaders(),
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (manualOverride: ManualOverride) => {
      const { data } = await apiClient.put(
        '/seller/shop/toggle',
        { manualOverride },
        { headers: getAuthHeaders() },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateShop: updateMutation.mutateAsync,
    updateHours: updateHoursMutation.mutateAsync,
    toggleShop: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    isSavingHours: updateHoursMutation.isPending,
  };
}
