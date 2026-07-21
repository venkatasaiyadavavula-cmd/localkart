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
    onSuccess: (shop) => {
      const { user, setUser } = useAuthStore.getState();
      if (user) {
        setUser({
          ...user,
          role: 'seller',
          shopId: shop?.id ?? user.shopId,
        });
      }
      router.push('/dashboard');
    },
  });

  return {
    createShop: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
