import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

interface DashboardActivity {
  id: string;
  type: 'order' | 'shop' | 'product' | 'user';
  description: string;
  createdAt: string;
}

interface RevenueChartPoint {
  date: string;
  revenue: number;
  commission: number;
}

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
  revenueChart: RevenueChartPoint[];
  recentActivity: DashboardActivity[];
}

interface AdminDashboardApiResponse {
  totalRevenue: number | string;
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
  recentActivity: DashboardActivity[];
}

export function useAdminDashboard(period: 'week' | 'month' | 'year' = 'week') {
  const query = useQuery<AdminDashboardData>({
    queryKey: ['admin', 'dashboard', period],
    queryFn: async () => {
      const [dashboardRes, chartRes] = await Promise.all([
        apiClient.get(`/admin/dashboard?period=${period}`),
        apiClient.get(`/admin/dashboard/revenue-chart?period=${period}`),
      ]);

      const raw = unwrapApiData<AdminDashboardApiResponse>(dashboardRes.data);
      const revenueChart = unwrapApiData<RevenueChartPoint[]>(chartRes.data).map(
        (point) => ({
          date: point.date,
          revenue: Number(point.revenue) || 0,
          commission: Number(point.commission) || 0,
        }),
      );

      return {
        totalRevenue: Number(raw.totalRevenue) || 0,
        totalOrders: raw.totalOrders,
        activeShops: raw.activeShops,
        totalCustomers: raw.totalCustomers,
        revenueChange: raw.revenueChange,
        ordersChange: raw.ordersChange,
        shopsChange: raw.shopsChange,
        customersChange: raw.customersChange,
        pendingShops: raw.pendingShops,
        pendingProducts: raw.pendingProducts,
        openDisputes: raw.openDisputes,
        revenueChart,
        recentActivity: raw.recentActivity ?? [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
