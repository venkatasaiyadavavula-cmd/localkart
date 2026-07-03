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
import { useSubscription } from '@/hooks/use-subscription';
import { formatPrice } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { Skeleton } from '@/components/ui/skeleton';

const plans = SUBSCRIPTION_PLANS.map((p) => ({
  name: p.name,
  price: p.price,
  productLimit: p.productLimit,
  features: p.features,
  icon: p.plan === 'starter' ? Zap : p.plan === 'growth' ? Sparkles : Crown,
  color: p.plan === 'starter' ? 'bg-gray-100 text-gray-800' : p.plan === 'growth' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800',
  popular: p.plan === 'growth',
}));

export default function SubscriptionPage() {
  const { data: subscription, isLoading, subscribe } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    const plan = plans.find((p) => p.name === selectedPlan);
    setIsSubscribing(true);
    try {
      const result = await subscribe(selectedPlan.toLowerCase());
      void result;
      if (plan && plan.price > 0) {
        toast.info('Plan request submitted. Payment integration coming soon — contact support to activate.');
      } else {
        toast.success(`You are on the ${selectedPlan} plan.`);
      }
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Failed to update subscription. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>

      {/* Current Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${plans.find(p => p.name.toLowerCase() === currentPlan)?.color}`}>
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
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(plans.find(p => p.name.toLowerCase() === currentPlan)?.price || 0)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              {subscription?.endDate && (
                <p className="text-xs text-muted-foreground">
                  Renews on {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Separator className="my-4" />
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${(productCount / productLimit) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.name.toLowerCase() === currentPlan;

            return (
              <motion.div
                key={plan.name}
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
                      disabled={isCurrent}
                      onClick={() => setSelectedPlan(plan.name)}
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

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You are about to subscribe to the {selectedPlan} plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Your card will be charged{' '}
              <span className="font-semibold">
                {formatPrice(plans.find(p => p.name === selectedPlan)?.price || 0)}
              </span>{' '}
              per month.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe} disabled={isSubscribing}>
              {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Subscribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
