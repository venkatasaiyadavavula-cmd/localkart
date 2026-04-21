export type SubscriptionPlan = 'starter' | 'growth' | 'business';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface Subscription {
  id: string;
  shopId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  productLimit: number;
  price: number;
  startDate: string;
  endDate: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanDetails {
  plan: SubscriptionPlan;
  name: string;
  productLimit: number;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    plan: 'starter',
    name: 'Starter',
    productLimit: 30,
    price: 0,
    features: ['30 product listings', 'Basic analytics', 'Email support'],
  },
  {
    plan: 'growth',
    name: 'Growth',
    productLimit: 60,
    price: 199,
    features: ['60 product listings', 'Advanced analytics', 'Priority support', 'Sponsored product discount'],
  },
  {
    plan: 'business',
    name: 'Business',
    productLimit: 100,
    price: 499,
    features: ['100 product listings', 'Premium analytics', '24/7 dedicated support', 'Free video uploads (5/month)'],
  },
];
