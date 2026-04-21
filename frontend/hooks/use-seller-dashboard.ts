import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function useSellerDashboard(period: 'week' | 'month' | 'year' = 'week') {
  return useQuery({
    queryKey: ['seller', 'dashboard', period],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.get(`/seller/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });
}
