import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useCreateShop() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: async (shopData: any) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.post('/seller/shop', shopData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
    onSuccess: () => {
      router.push('/seller/dashboard');
    },
  });
}
