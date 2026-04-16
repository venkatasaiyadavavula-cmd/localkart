import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

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
      const { data } = await apiClient.get(`/admin/dashboard?period=${period}`);
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
