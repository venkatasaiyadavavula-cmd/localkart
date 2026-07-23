import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData, unwrapPaginated } from '@/lib/utils/api';
import type { Order, OrderStatus } from '@/types/order';

export interface AdminOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  shopId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  shopSearch?: string;
  customerSearch?: string;
}

function adminOrdersQueryKey(params: AdminOrdersParams) {
  return [
    'admin',
    'orders',
    params.page ?? 1,
    params.limit ?? 20,
    params.status ?? 'all',
    params.shopId ?? '',
    params.customerId ?? '',
    params.dateFrom ?? '',
    params.dateTo ?? '',
    params.shopSearch ?? '',
    params.customerSearch ?? '',
  ] as const;
}

export function useAdminOrders(
  params: AdminOrdersParams = {},
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminOrdersQueryKey(params),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('limit', String(params.limit ?? 20));
      if (params.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      if (params.shopId) searchParams.set('shopId', params.shopId);
      if (params.customerId) searchParams.set('customerId', params.customerId);
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
      if (params.shopSearch) searchParams.set('shopSearch', params.shopSearch);
      if (params.customerSearch) {
        searchParams.set('customerSearch', params.customerSearch);
      }

      const { data } = await apiClient.get(
        `/orders/admin/all?${searchParams.toString()}`,
      );
      return unwrapPaginated<Order>(data);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      notes,
    }: {
      orderId: string;
      status: OrderStatus;
      notes?: string;
    }) => {
      const { data } = await apiClient.put(`/orders/admin/${orderId}/status`, {
        status,
        notes,
      });
      return unwrapApiData<Order>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });

  return {
    orders: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) =>
      updateStatusMutation.mutateAsync({ orderId, status, notes }),
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export function useAdminOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${orderId}`);
      return unwrapApiData<Order>(data);
    },
  });
}
