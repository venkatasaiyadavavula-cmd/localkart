import { Controller, Post, Req, Res, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';
import { Public } from '../../core/decorators/public.decorator';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook asynchronously (acknowledge receipt immediately)
    res.status(200).json({ received: true });

    // Process in background
    this.paymentsService.processRazorpayWebhook(req.body).catch((err) => {
      console.error('Webhook processing error:', err);
    });
  }
}
