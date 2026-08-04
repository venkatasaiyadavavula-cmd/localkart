import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { SELLER_ONBOARDING_GATE_QUERY_KEY } from '@/lib/seller-onboarding-query';
import { useAuthStore } from './use-auth';

export function useCreateShop() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const { data } = await apiClient.post('/seller/shop', shopData);
      return data?.data ?? data;
    },
    onSuccess: async () => {
      const { refreshSession } = useAuthStore.getState();
      await refreshSession();
      // Gate uses staleTime: 30s — refetch so pending screen shows immediately after createShop.
      await queryClient.refetchQueries({ queryKey: SELLER_ONBOARDING_GATE_QUERY_KEY });
      toast.success('Shop submitted for approval!');
      router.refresh();
      router.push('/seller-onboarding');
    },
  });

  return {
    createShop: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
