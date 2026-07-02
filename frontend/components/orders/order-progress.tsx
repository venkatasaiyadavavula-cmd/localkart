'use client';

import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import {
  TRACKING_STEPS,
  getTrackingStepIndex,
} from '@/lib/order-tracking';

interface OrderProgressProps {
  status: string;
  variant?: 'vertical' | 'compact';
  liveHint?: string;
}

export function OrderProgress({ status, variant = 'vertical', liveHint }: OrderProgressProps) {
  const currentIdx = getTrackingStepIndex(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
        <XCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold">Order Cancelled</p>
          <p className="text-xs opacity-80">This order will not be delivered</p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        {TRACKING_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <motion.div
                className="h-2 rounded-full transition-all"
                style={{
                  width: isCurrent ? 24 : 12,
                  background: isDone ? step.color : '#E5E9F2',
                }}
                animate={isCurrent ? { opacity: [1, 0.6, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              {idx < TRACKING_STEPS.length - 1 && (
                <div
                  className="h-0.5 w-2"
                  style={{ background: idx < currentIdx ? step.color : '#E5E9F2' }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {TRACKING_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === TRACKING_STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: isDone ? step.color : '#F3F4F6',
                  boxShadow: isCurrent ? `0 6px 20px ${step.color}50` : 'none',
                }}
                animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: isDone ? 'white' : '#D1D5DB' }} />
              </motion.div>
              {!isLast && (
                <div
                  className="my-1 w-0.5 flex-1"
                  style={{
                    minHeight: 28,
                    background:
                      idx < currentIdx
                        ? `linear-gradient(180deg, ${step.color}, ${TRACKING_STEPS[idx + 1].color})`
                        : '#E5E9F2',
                  }}
                />
              )}
            </div>
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
              <p
                className="text-sm font-extrabold leading-none mt-2.5"
                style={{ color: isDone ? '#111827' : '#9CA3AF' }}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="mt-1 text-[11px] font-semibold" style={{ color: step.color }}>
                  {liveHint ?? step.subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
