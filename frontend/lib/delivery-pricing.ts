/**
 * Distance-based delivery pricing
 * - Up to 4 km: Free
 * - 5–7 km: ₹30
 * - 8–10 km: ₹50
 * - Beyond 10 km: Not serviceable
 */

export const MAX_DELIVERY_RADIUS_KM = 10;

export const DELIVERY_CHARGE_TIERS = [
  { maxDistanceKm: 4, charge: 0, label: 'Up to 4 km — Free' },
  { maxDistanceKm: 7, charge: 30, label: '5–7 km — ₹30' },
  { maxDistanceKm: 10, charge: 50, label: '8–10 km — ₹50' },
] as const;

export function calculateDeliveryCharge(distanceKm: number): number {
  if (distanceKm <= 0) return 0;

  for (const tier of DELIVERY_CHARGE_TIERS) {
    if (distanceKm <= tier.maxDistanceKm) {
      return tier.charge;
    }
  }

  return -1;
}

export function isWithinDeliveryRadius(distanceKm: number): boolean {
  return distanceKm > 0 && distanceKm <= MAX_DELIVERY_RADIUS_KM;
}

export function getDeliveryPricingSummary(): string {
  return 'Free up to 4 km · ₹30 for 5–7 km · ₹50 for 8–10 km';
}

export const DELIVERY_CHARGES = DELIVERY_CHARGE_TIERS.map((tier) => ({
  maxDistance: tier.maxDistanceKm,
  charge: tier.charge,
}));
