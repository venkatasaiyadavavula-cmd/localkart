"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELIVERY_CHARGE_TIERS = exports.MAX_DELIVERY_RADIUS_KM = void 0;
exports.calculateDeliveryCharge = calculateDeliveryCharge;
exports.isWithinDeliveryRadius = isWithinDeliveryRadius;
exports.getDeliveryPricingSummary = getDeliveryPricingSummary;
exports.haversineDistanceKm = haversineDistanceKm;
exports.MAX_DELIVERY_RADIUS_KM = 10;
exports.DELIVERY_CHARGE_TIERS = [
    { maxDistanceKm: 4, charge: 0, label: 'Up to 4 km — Free' },
    { maxDistanceKm: 7, charge: 30, label: '5–7 km — ₹30' },
    { maxDistanceKm: 10, charge: 50, label: '8–10 km — ₹50' },
];
function calculateDeliveryCharge(distanceKm) {
    if (distanceKm <= 0)
        return 0;
    for (const tier of exports.DELIVERY_CHARGE_TIERS) {
        if (distanceKm <= tier.maxDistanceKm) {
            return tier.charge;
        }
    }
    return -1;
}
function isWithinDeliveryRadius(distanceKm) {
    return distanceKm > 0 && distanceKm <= exports.MAX_DELIVERY_RADIUS_KM;
}
function getDeliveryPricingSummary() {
    return 'Free up to 4 km · ₹30 for 5–7 km · ₹50 for 8–10 km';
}
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
//# sourceMappingURL=delivery-pricing.js.map