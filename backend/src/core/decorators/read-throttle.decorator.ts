import { applyDecorators } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

/** Higher limit for public read-only catalog/browse endpoints (300 req/min per IP). */
export const READ_THROTTLE = { read: { limit: 300, ttl: 60000 } };

export function ReadThrottle() {
  // NestJS v5 applies every configured throttler (default 120/min, auth 10/min) unless skipped.
  return applyDecorators(
    SkipThrottle({ default: true, auth: true }),
    Throttle(READ_THROTTLE),
  );
}
