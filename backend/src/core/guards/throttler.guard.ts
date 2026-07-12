import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import {
  QA_THROTTLE_BYPASS_HEADER,
  QA_THROTTLE_BYPASS_MIN_LENGTH,
} from '../constants/qa-throttle.constants';

/**
 * Global rate limiter. Honors X-Forwarded-For behind nginx.
 * CI bypass: when QA_THROTTLE_BYPASS_TOKEN is set on the server (32+ chars),
 * requests with matching X-QA-Throttle-Bypass header skip throttling.
 * Secret is never shipped to the frontend — only Playwright/CI scripts.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (this.hasValidQaBypass(context)) {
      return true;
    }
    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }

  private hasValidQaBypass(context: ExecutionContext): boolean {
    const secret = process.env.QA_THROTTLE_BYPASS_TOKEN;
    if (!secret || secret.length < QA_THROTTLE_BYPASS_MIN_LENGTH) {
      return false;
    }

    const req = context.switchToHttp().getRequest();
    const provided = req.headers?.[QA_THROTTLE_BYPASS_HEADER];
    if (typeof provided !== 'string' || provided.length !== secret.length) {
      return false;
    }

    try {
      return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
    } catch {
      return false;
    }
  }
}
