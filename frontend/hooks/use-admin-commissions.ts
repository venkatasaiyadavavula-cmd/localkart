import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import type { AdminCommissionBill, AdminCommissionSummary } from '@/types/api';

export type AdminBillStatusFilter = 'all' | 'pending' | 'overdue' | 'paid';

interface AdminBillsParams {
  status?: AdminBillStatusFilter;
  shopId?: string;
  week?: string;
  page?: number;
  limit?: number;
}

interface AdminBillsResponse {
  data: AdminCommissionBill[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function adminBillsQueryKey(params: AdminBillsParams) {
  return [
    'admin',
    'commission-bills',
    params.status ?? 'all',
    params.shopId ?? '',
    params.week ?? '',
    params.page ?? 1,
    params.limit ?? 20,
  ] as const;
}

export function useAdminCommissions(params: AdminBillsParams = {}) {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery<AdminCommissionSummary>({
    queryKey: ['admin', 'commission-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/commission/admin/summary');
      return unwrapApiData<AdminCommissionSummary>(data);
    },
  });

  const billsQuery = useQuery<AdminBillsResponse>({
    queryKey: adminBillsQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      if (params.shopId) searchParams.set('shopId', params.shopId);
      if (params.week) searchParams.set('week', params.week);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));

      const qs = searchParams.toString();
      const { data } = await apiClient.get(
        `/commission/admin/bills${qs ? `?${qs}` : ''}`,
      );
      const payload = unwrapApiData<AdminCommissionBill[] | AdminBillsResponse>(data);
      if (Array.isArray(payload)) {
        return {
          data: payload,
          meta: { total: payload.length, page: 1, limit: payload.length, totalPages: 1 },
        };
      }
      return payload;
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({
      billId,
      paymentRef,
      note,
    }: {
      billId: string;
      paymentRef?: string;
      note?: string;
    }) => {
      const { data } = await apiClient.post(`/commission/admin/bills/${billId}/mark-paid`, {
        paymentRef,
        note,
      });
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-bills'] });
    },
  });

  const generateBillsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/commission/admin/generate-today', {});
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-bills'] });
    },
  });

  const applyFinesMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/commission/admin/apply-fines', {});
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-bills'] });
    },
  });

  return {
    summary: summaryQuery.data,
    bills: billsQuery.data?.data ?? [],
    billsMeta: billsQuery.data?.meta,
    isLoading: summaryQuery.isLoading || billsQuery.isLoading,
    isError: summaryQuery.isError || billsQuery.isError,
    refetch: () => {
      void summaryQuery.refetch();
      void billsQuery.refetch();
    },
    markBillPaid: (billId: string, paymentRef?: string, note?: string) =>
      markPaidMutation.mutateAsync({ billId, paymentRef, note }),
    generateWeeklyBills: () => generateBillsMutation.mutateAsync(),
    applyOverdueFines: () => applyFinesMutation.mutateAsync(),
    isMarkingPaid: markPaidMutation.isPending,
    isGeneratingBills: generateBillsMutation.isPending,
    isApplyingFines: applyFinesMutation.isPending,
  };
}
