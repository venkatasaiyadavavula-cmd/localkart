import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import type { SubscriptionData } from '@/types/api';

export type SubscribePaymentPayload = {
  requiresPayment: boolean;
  subscriptionId?: string;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
  plan?: string;
  subscription?: unknown;
};

export function useSubscription() {
  const queryClient = useQueryClient();

  const query = useQuery<SubscriptionData>({
    queryKey: ['seller', 'subscription'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/subscription');
      return unwrapApiData<SubscriptionData>(data);
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await apiClient.post('/seller/subscription/subscribe', { plan });
      return unwrapApiData<SubscribePaymentPayload>(data);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (payload: {
      subscriptionId: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    }) => {
      const { subscriptionId, ...body } = payload;
      const { data } = await apiClient.post(
        `/seller/subscription/verify/${subscriptionId}`,
        body,
      );
      return unwrapApiData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'subscription'] });
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['seller', 'subscription'] });

  return {
    data: query.data,
    isLoading: query.isLoading,
    subscribe: subscribeMutation.mutateAsync,
    verifyPayment: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    invalidate,
  };
}
