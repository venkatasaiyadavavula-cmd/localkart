export declare const MAX_DELIVERY_RADIUS_KM = 10;
export declare const DELIVERY_CHARGE_TIERS: readonly [{
    readonly maxDistanceKm: 4;
    readonly charge: 0;
    readonly label: "Up to 4 km — Free";
}, {
    readonly maxDistanceKm: 7;
    readonly charge: 30;
    readonly label: "5–7 km — ₹30";
}, {
    readonly maxDistanceKm: 10;
    readonly charge: 50;
    readonly label: "8–10 km — ₹50";
}];
export declare function calculateDeliveryCharge(distanceKm: number): number;
export declare function isWithinDeliveryRadius(distanceKm: number): boolean;
export declare function getDeliveryPricingSummary(): string;
export declare function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
