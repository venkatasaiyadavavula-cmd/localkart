import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from './use-auth';

export function useCreateShop() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const { data } = await apiClient.post('/seller/shop', shopData);
      return data?.data ?? data;
    },
    onSuccess: async () => {
      const { refreshSession } = useAuthStore.getState();
      await refreshSession();
      router.push('/seller-onboarding');
    },
  });

  return {
    createShop: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
