/**
 * Distance-based delivery pricing for LocalKart Kadapa
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

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
