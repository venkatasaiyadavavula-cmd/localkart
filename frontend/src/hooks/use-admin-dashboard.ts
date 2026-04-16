import { useState, useEffect } from "react";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalVendors: number;
  revenueGrowth: number;
  ordersGrowth: number;
  usersGrowth: number;
  vendorsGrowth: number;
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 124500,
    totalOrders: 1840,
    totalUsers: 3200,
    totalVendors: 145,
    revenueGrowth: 12.5,
    ordersGrowth: 8.2,
    usersGrowth: 15.3,
    vendorsGrowth: 4.7,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return { stats, loading };
}
