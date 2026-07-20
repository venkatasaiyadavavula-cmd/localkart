import * as crypto from 'crypto';
import { WebhookController } from './webhook.controller';
import { PaymentsService } from './payments.service';

const WEBHOOK_SECRET = 'test_webhook_secret_32_chars_minimum_xx';

describe('WebhookController', () => {
  const originalEnv = process.env;
  let controller: WebhookController;
  let paymentsService: { processRazorpayWebhook: jest.Mock };
  let res: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PAYMENTS_ENABLED: 'true',
      RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    };

    paymentsService = { processRazorpayWebhook: jest.fn().mockResolvedValue(undefined) };
    controller = new WebhookController(paymentsService as unknown as PaymentsService);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function signRaw(rawBody: string): string {
    return crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  }

  it('verifies signature against raw request body bytes', async () => {
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });
    const signature = signRaw(rawBody);

    await controller.handleRazorpayWebhook(
      signature,
      { rawBody: Buffer.from(rawBody, 'utf8') } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(paymentsService.processRazorpayWebhook).toHaveBeenCalledWith(JSON.parse(rawBody));
  });

  it('rejects an invalid signature', async () => {
    const rawBody = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_1"}}}}';

    await controller.handleRazorpayWebhook(
      'deadbeef'.repeat(8),
      { rawBody: Buffer.from(rawBody, 'utf8') } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(paymentsService.processRazorpayWebhook).not.toHaveBeenCalled();
  });

  it('rejects signature from re-serialized body when raw bytes differ', async () => {
    const rawBody =
      '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_1","amount":50000}}}}';
    const prettyBody = JSON.stringify(JSON.parse(rawBody), null, 2);
    const wrongSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(prettyBody).digest('hex');

    await controller.handleRazorpayWebhook(
      wrongSig,
      { rawBody: Buffer.from(rawBody, 'utf8') } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(paymentsService.processRazorpayWebhook).not.toHaveBeenCalled();
  });

  it('returns 503 when PAYMENTS_ENABLED is false', async () => {
    process.env.PAYMENTS_ENABLED = 'false';

    await controller.handleRazorpayWebhook(
      'sig',
      { rawBody: Buffer.from('{}') } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });
});
