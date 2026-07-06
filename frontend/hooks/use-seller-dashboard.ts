import { useApiQuery } from '@/lib/hooks/use-api-query';
import type { SellerDashboardStats } from '@/types/api';

export function useSellerDashboard(period: 'week' | 'month' | 'year' = 'week') {
  return useApiQuery<SellerDashboardStats>(
    ['seller', 'dashboard', period],
    `/seller/dashboard?period=${period}`,
  );
}
