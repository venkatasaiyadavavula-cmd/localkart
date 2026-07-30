'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubscription } from '@/hooks/use-subscription';
import { formatPrice } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const plans = SUBSCRIPTION_PLANS.map((p) => ({
  name: p.name,
  planId: p.plan,
  price: p.price,
  productLimit: p.productLimit,
  features: p.features,
  icon: p.plan === 'starter' ? Zap : p.plan === 'growth' ? Sparkles : Crown,
  color: p.plan === 'starter' ? 'bg-gray-100 text-gray-800' : p.plan === 'growth' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800',
  popular: p.plan === 'growth',
}));

declare global { interface Window { Razorpay: any; } }

export default function SubscriptionPage() {
  const {
    data: subscription,
    isLoading,
    isError,
    refetch,
    subscribe,
    verifyPayment,
    cancelSubscription,
    invalidate,
    isCancelling,
  } = useSubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<'idle' | 'checkout' | 'verifying'>('idle');

  const selectedPlan = plans.find((p) => p.planId === selectedPlanId);

  const loadRazorpay = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });

  const openCheckout = async (order: {
    subscriptionId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    key?: string;
    plan?: string;
  }) => {
    const checkoutKey = RAZORPAY_KEY || order.key;
    if (!checkoutKey) {
      toast.error('Razorpay is not configured. Contact support.');
      return;
    }
    await loadRazorpay();
    setPaymentPhase('checkout');
    const rzp = new window.Razorpay({
      key: checkoutKey,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: 'LocalKart',
      description: `${order.plan ?? 'Subscription'} plan — monthly`,
      theme: { color: '#3D5AF1' },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setPaymentPhase('verifying');
        try {
          await verifyPayment({
            subscriptionId: order.subscriptionId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast.success('Subscription upgraded successfully.');
          setSelectedPlanId(null);
          await invalidate();
        } catch {
          toast.error(
            'Payment received but activation failed. Contact support with your payment ID.',
          );
        } finally {
          setPaymentPhase('idle');
        }
      },
      modal: {
        ondismiss: () => {
          setPaymentPhase('idle');
          toast.message('Payment cancelled — your current plan is unchanged.');
        },
      },
    });
    rzp.open();
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    setIsSubscribing(true);
    try {
      const result = await subscribe(selectedPlanId);
      if (result.requiresPayment && result.subscriptionId && result.razorpayOrderId) {
        setSelectedPlanId(null);
        await openCheckout({
          subscriptionId: result.subscriptionId,
          razorpayOrderId: result.razorpayOrderId,
          amount: result.amount ?? 0,
          currency: result.currency ?? 'INR',
          key: result.key,
          plan: result.plan,
        });
      } else {
        toast.success(`You are on the ${selectedPlan?.name ?? 'new'} plan.`);
        setSelectedPlanId(null);
        await invalidate();
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to update subscription. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled. You are now on the Starter plan.');
      setShowCancelDialog(false);
      await invalidate();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to cancel subscription. Please try again.');
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Subscription</h1>
        <ErrorState title="Could not load subscription" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan?.toLowerCase() || 'starter';
  const productCount = subscription?.productCount || 0;
  const productLimit = subscription?.productLimit || SUBSCRIPTION_PLANS[0].productLimit;
  const busy = isSubscribing || paymentPhase !== 'idle';
  const hasPaidSubscription =
    currentPlan !== 'starter' && (subscription?.price ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>

      {paymentPhase === 'verifying' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Confirming your payment…
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${plans.find(p => p.planId === currentPlan)?.color}`}>
                {currentPlan === 'starter' && <Zap className="h-6 w-6" />}
                {currentPlan === 'growth' && <Sparkles className="h-6 w-6" />}
                {currentPlan === 'business' && <Crown className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-lg font-semibold capitalize">{currentPlan} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {productCount} of {productLimit} products used
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(plans.find(p => p.planId === currentPlan)?.price || 0)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              {subscription?.endDate && (
                <p className="text-xs text-muted-foreground">
                  Valid until {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Separator className="my-4" />
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (productCount / productLimit) * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Paid plans renew monthly via Razorpay checkout (manual payment each month). Auto-recurring
            billing is planned as a fast-follow.
          </p>
          {hasPaidSubscription && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Need to step down? You can cancel your paid plan and return to Starter.
              </p>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={busy || isCancelling}
                onClick={() => setShowCancelDialog(true)}
              >
                {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.planId === currentPlan;

            return (
              <motion.div
                key={plan.planId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: plans.indexOf(plan) * 0.1 }}
              >
                <Card className={`relative ${plan.popular ? 'border-primary shadow-glow' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      <div className={`rounded-full p-2 ${plan.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <CardDescription>
                      <span className="font-heading text-3xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent || busy}
                      onClick={() => setSelectedPlanId(plan.planId)}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedPlanId} onOpenChange={() => !busy && setSelectedPlanId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You are about to subscribe to the {selectedPlan?.name} plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              You will pay{' '}
              <span className="font-semibold">{formatPrice(selectedPlan?.price || 0)}</span> now via
              Razorpay to activate this plan for one month.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlanId(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {selectedPlan && selectedPlan.price > 0 ? 'Pay & Activate' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={(open) => !isCancelling && setShowCancelDialog(open)}>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Your paid plan will be cancelled immediately. You will revert to the free Starter
                plan (40 product listings) right away — any remaining time on your current billing
                period is not kept active.
              </span>
              <span className="block">
                If you have more than 40 live products, you may need to remove listings before adding
                new ones.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep plan</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
            >
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
