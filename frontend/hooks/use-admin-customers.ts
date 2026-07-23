import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginated } from '@/lib/utils/api';

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface AdminCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: 'all' | 'active' | 'inactive';
  dateFrom?: string;
  dateTo?: string;
}

function adminCustomersQueryKey(params: AdminCustomersParams) {
  return [
    'admin',
    'customers',
    params.page ?? 1,
    params.limit ?? 20,
    params.search ?? '',
    params.isActive ?? 'all',
    params.dateFrom ?? '',
    params.dateTo ?? '',
  ] as const;
}

export function useAdminCustomers(params: AdminCustomersParams = {}) {
  const query = useQuery({
    queryKey: adminCustomersQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('limit', String(params.limit ?? 20));
      if (params.search) searchParams.set('search', params.search);
      if (params.isActive === 'active') searchParams.set('isActive', 'true');
      if (params.isActive === 'inactive') searchParams.set('isActive', 'false');
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);

      const { data } = await apiClient.get(
        `/admin/customers?${searchParams.toString()}`,
      );
      return unwrapPaginated<AdminCustomer>(data);
    },
  });

  return {
    customers: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
