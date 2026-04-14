import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-razorpay-signature');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();
  const payload = JSON.parse(body);

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook asynchronously
  const event = payload.event;
  const payment = payload.payload?.payment?.entity;
  const order = payload.payload?.order?.entity;

  try {
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payment);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payment);
        break;
      case 'refund.processed':
        await handleRefundProcessed(payload.payload.refund.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(order);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to acknowledge receipt
    return NextResponse.json({ received: true, error: 'Processing failed' });
  }
}

async function handlePaymentCaptured(payment: any) {
  // Update order status to PAID, release inventory, etc.
  console.log('Payment captured:', payment.id);
  // Call your backend service
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment.captured', payment }),
  });
}

async function handlePaymentFailed(payment: any) {
  console.log('Payment failed:', payment.id);
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment.failed', payment }),
  });
}

async function handleRefundProcessed(refund: any) {
  console.log('Refund processed:', refund.id);
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'refund.processed', refund }),
  });
}

async function handleOrderPaid(order: any) {
  console.log('Order paid:', order.id);
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'order.paid', order }),
  });
}
