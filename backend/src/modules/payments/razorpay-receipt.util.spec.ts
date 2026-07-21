import { razorpayReceipt, RAZORPAY_RECEIPT_MAX_LENGTH } from './razorpay-receipt.util';

describe('razorpayReceipt', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('fits commission bill receipt under Razorpay limit', () => {
    const receipt = razorpayReceipt('comm_', uuid);
    expect(receipt).toBe('comm_550e8400e29b41d4a716446655440000');
    expect(receipt.length).toBeLessThanOrEqual(RAZORPAY_RECEIPT_MAX_LENGTH);
  });

  it('fits order uuid receipt under Razorpay limit', () => {
    const receipt = razorpayReceipt('', uuid);
    expect(receipt).toBe('550e8400e29b41d4a716446655440000');
    expect(receipt.length).toBeLessThanOrEqual(RAZORPAY_RECEIPT_MAX_LENGTH);
  });

  it('truncates pathological ids', () => {
    const longId = 'x'.repeat(50);
    const receipt = razorpayReceipt('comm_', longId);
    expect(receipt.length).toBe(RAZORPAY_RECEIPT_MAX_LENGTH);
  });
});
