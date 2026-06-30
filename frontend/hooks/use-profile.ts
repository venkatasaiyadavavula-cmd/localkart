import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async (profileData: Record<string, unknown>) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.put('/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
