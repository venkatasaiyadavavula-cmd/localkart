import { Controller, Post, Req, Res, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';
import { Public } from '../../core/decorators/public.decorator';
import { isPaymentsEnabled } from './payments.config';

type RawBodyRequest = Request & { rawBody?: Buffer };

/** Constant-time compare for hex HMAC digests; returns false on length mismatch. */
function timingSafeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest,
    @Res() res: Response,
  ) {
    if (!isPaymentsEnabled()) {
      return res.status(503).json({ error: 'Payment gateway not available' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      return res.status(400).json({ error: 'Missing raw request body' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (!signature || !timingSafeEqualHex(signature, expectedSignature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    res.status(200).json({ received: true });

    this.paymentsService.processRazorpayWebhook(event).catch((err) => {
      console.error('Webhook processing error:', err);
    });
  }
}
