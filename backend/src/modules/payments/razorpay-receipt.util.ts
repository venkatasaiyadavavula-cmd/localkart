/** Razorpay order `receipt` field max length. */
export const RAZORPAY_RECEIPT_MAX_LENGTH = 40;

/**
 * Build a Razorpay order receipt within the 40-char limit.
 * Strips UUID hyphens; truncates if still too long. Full id should live in `notes`.
 */
export function razorpayReceipt(prefix: string, entityId: string): string {
  const compact = entityId.replace(/-/g, '');
  const receipt = `${prefix}${compact}`;
  return receipt.length <= RAZORPAY_RECEIPT_MAX_LENGTH
    ? receipt
    : receipt.slice(0, RAZORPAY_RECEIPT_MAX_LENGTH);
}
