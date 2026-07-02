import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import { useAuthStore } from './use-auth';

export function useProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async (profileData: Record<string, unknown>) => {
      const { data } = await apiClient.put('/users/profile', profileData);
      return unwrapApiData(data);
    },
    onSuccess: (data) => {
      setUser(data as Parameters<typeof setUser>[0]);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
