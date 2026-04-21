import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface AdminDashboardData {
  totalRevenue: number;
  totalOrders: number;
  activeShops: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  shopsChange: number;
  customersChange: number;
  pendingShops: number;
  pendingProducts: number;
  openDisputes: number;
  revenueChart: { date: string; revenue: number; commission: number }[];
  recentActivity: any[];
}

export function useAdminDashboard(period: 'week' | 'month' | 'year' = 'week') {
  return useQuery<AdminDashboardData>({
    queryKey: ['admin', 'dashboard', period],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.get(`/admin/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
