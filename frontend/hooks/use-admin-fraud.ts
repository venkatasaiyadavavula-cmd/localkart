import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

export interface SuspiciousOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
}

export function useAdminFraud() {
  const queryClient = useQueryClient();

  const suspiciousQuery = useQuery<SuspiciousOrder[]>({
    queryKey: ['admin', 'fraud', 'suspicious-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/fraud/suspicious-orders');
      return unwrapApiData<SuspiciousOrder[]>(data) ?? [];
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { data } = await apiClient.post(`/admin/fraud/blacklist/${userId}`, { reason });
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fraud', 'suspicious-orders'] });
    },
  });

  const assessCodRisk = async (orderId: string) => {
    const { data } = await apiClient.get(`/admin/fraud/cod-risk/${orderId}`);
    return unwrapApiData<Record<string, unknown>>(data);
  };

  return {
    suspiciousOrders: suspiciousQuery.data ?? [],
    isLoading: suspiciousQuery.isLoading,
    isError: suspiciousQuery.isError,
    refetch: suspiciousQuery.refetch,
    blacklistUser: (userId: string, reason: string) =>
      blacklistMutation.mutateAsync({ userId, reason }),
    isBlacklisting: blacklistMutation.isPending,
    assessCodRisk,
  };
}
