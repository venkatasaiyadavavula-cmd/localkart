import {
  CheckCircle2,
  Package,
  Store,
  Truck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { OrderStatus } from '@/types/order';

export interface TrackingStep {
  key: OrderStatus | 'pending_otp';
  label: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
}

export const TRACKING_STEPS: TrackingStep[] = [
  {
    key: 'pending_otp',
    label: 'Order Placed',
    subtitle: 'OTP verify చేసి confirm చేయండి',
    icon: ShieldCheck,
    color: '#F59E0B',
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    subtitle: 'Shop accepted your order',
    icon: CheckCircle2,
    color: '#3D5AF1',
  },
  {
    key: 'processing',
    label: 'Being Prepared',
    subtitle: 'Your items are being packed',
    icon: Package,
    color: '#8B5CF6',
  },
  {
    key: 'ready_for_pickup',
    label: 'Ready for Pickup',
    subtitle: 'Delivery partner picking up',
    icon: Store,
    color: '#6366F1',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    subtitle: 'On the way to you',
    icon: Truck,
    color: '#059669',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    subtitle: 'Enjoy your order!',
    icon: CheckCircle2,
    color: '#10B981',
  },
];

const STATUS_INDEX: Record<string, number> = Object.fromEntries(
  TRACKING_STEPS.map((s, i) => [s.key, i]),
);

export function getTrackingStepIndex(status: string): number {
  if (status === 'cancelled' || status === 'return_requested' || status === 'returned') {
    return -1;
  }
  return STATUS_INDEX[status] ?? -1;
}

export function getTrackingProgress(status: string): number {
  const idx = getTrackingStepIndex(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / TRACKING_STEPS.length) * 100);
}

export function getStatusHeadline(status: string): { title: string; subtitle: string } {
  const map: Record<string, { title: string; subtitle: string }> = {
    pending_otp: {
      title: 'Order Placed!',
      subtitle: 'OTP verify చేసి order confirm చేయండి',
    },
    confirmed: {
      title: 'Order Confirmed',
      subtitle: 'Shop is getting your order ready',
    },
    processing: {
      title: 'Preparing Your Order',
      subtitle: 'Items are being carefully packed',
    },
    ready_for_pickup: {
      title: 'Ready for Pickup',
      subtitle: 'Delivery partner is on the way to shop',
    },
    out_for_delivery: {
      title: 'On the Way!',
      subtitle: 'Your order is heading to you',
    },
    delivered: {
      title: 'Delivered!',
      subtitle: 'Thank you for shopping with LocalKart',
    },
    cancelled: {
      title: 'Order Cancelled',
      subtitle: 'This order was cancelled',
    },
  };
  return map[status] ?? { title: 'Tracking Order', subtitle: 'Live updates below' };
}

export const ACTIVE_TRACK_STATUSES = [
  'pending_otp',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'out_for_delivery',
] as const;

export function canTrackLive(status: string): boolean {
  return ACTIVE_TRACK_STATUSES.includes(status as (typeof ACTIVE_TRACK_STATUSES)[number]);
}
