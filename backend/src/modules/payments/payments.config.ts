import { ServiceUnavailableException } from '@nestjs/common';

export function isPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === 'true';
}

export function assertPaymentsEnabled(): void {
  if (!isPaymentsEnabled()) {
    throw new ServiceUnavailableException('Payment gateway not available');
  }
}
