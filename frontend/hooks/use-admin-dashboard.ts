import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

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

/** Shape returned by GET /admin/dashboard */
interface AdminDashboardApiResponse {
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number | string;
  pendingShops: number;
  pendingProducts: number;
  todayOrders?: number;
  totalCommission?: number;
}

export function useAdminDashboard(period: 'week' | 'month' | 'year' = 'week') {
  return useQuery<AdminDashboardData>({
    queryKey: ['admin', 'dashboard', period],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/dashboard?period=${period}`);
      const raw = unwrapApiData<AdminDashboardApiResponse>(data);
      return {
        totalCustomers: raw.totalUsers,
        activeShops: raw.totalShops,
        totalOrders: raw.totalOrders,
        totalRevenue: Number(raw.totalRevenue) || 0,
        pendingShops: raw.pendingShops,
        pendingProducts: raw.pendingProducts,
        revenueChange: 0,
        ordersChange: 0,
        shopsChange: 0,
        customersChange: 0,
        openDisputes: 0,
        revenueChart: [],
        recentActivity: [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
