import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export function useCreateShop() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (shopData: Record<string, unknown>) => {
      const { data } = await apiClient.post('/seller/shop', shopData);
      return data.data;
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  return {
    createShop: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
