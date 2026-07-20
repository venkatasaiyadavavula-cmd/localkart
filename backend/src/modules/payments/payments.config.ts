import { ServiceUnavailableException } from '@nestjs/common';

/** Razorpay checkout session TTL — reused for idempotency and abandoned-order expiry. */
export const RAZORPAY_ORDER_TTL_MS = 30 * 60 * 1000;

export function isPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === 'true';
}

export function assertPaymentsEnabled(): void {
  if (!isPaymentsEnabled()) {
    throw new ServiceUnavailableException('Payment gateway not available');
  }
}
