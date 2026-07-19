export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + ' Cr';
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + ' L';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + ' K';
  }
  return num.toString();
}

/** Compact INR for chart axes (Indian K / L / Cr). */
export function formatCompactPrice(amount: number): string {
  if (Math.abs(amount) < 1000) {
    return formatPrice(amount);
  }
  return `₹${formatNumber(amount)}`;
}

export function formatDeliveryChargeMessage(charge: number): string {
  return charge === 0 ? 'Free delivery' : `Delivery charge: ${formatPrice(charge)}`;
}

export function calculateDiscount(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
