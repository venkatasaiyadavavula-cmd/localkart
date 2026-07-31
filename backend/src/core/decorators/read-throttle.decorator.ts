import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/** Higher limit for public read-only catalog/browse endpoints (300 req/min per IP). */
export const READ_THROTTLE = { read: { limit: 300, ttl: 60000 } };

export function ReadThrottle() {
  return applyDecorators(Throttle(READ_THROTTLE));
}
