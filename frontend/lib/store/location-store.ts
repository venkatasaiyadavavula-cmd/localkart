import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// కడప జిల్లా కేంద్రం
export const KADAPA_CENTER = {
  lat: 14.4673,
  lng: 78.8242,
};

// గరిష్ట డెలివరీ దూరం (కి.మీ.లలో)
export const MAX_DELIVERY_RADIUS_KM = 20;

// ==========================================
// డెలివరీ ఛార్జీలు (దూరం ఆధారంగా)
// ==========================================
export const DELIVERY_CHARGES = [
  { maxDistance: 5, charge: 20 },   // 5 కి.మీ లోపు = ₹20
  { maxDistance: 10, charge: 30 },  // 10 కి.మీ లోపు = ₹30
  { maxDistance: 20, charge: 50 },  // 20 కి.మీ లోపు = ₹50
];

/**
 * దూరం ఆధారంగా డెలివరీ ఛార్జ్ ని లెక్కిస్తుంది
 */
export const calculateDeliveryCharge = (distanceInKm: number): number => {
  if (distanceInKm <= 0) return 0;
  
  for (const tier of DELIVERY_CHARGES) {
    if (distanceInKm <= tier.maxDistance) {
      return tier.charge;
    }
  }
  // 20 కి.మీ కంటే ఎక్కువ అయితే డెలివరీ అందుబాటులో లేదు
  return -1;
};

/**
 * దూరాన్ని బట్టి డెలివరీ ఛార్జ్ మరియు అది సర్వీస్ చేయదగినదో కాదో తెలుపుతుంది
 */
export const getDeliveryInfo = (distanceInKm: number): { serviceable: boolean; charge: number; message: string } => {
  if (distanceInKm > MAX_DELIVERY_RADIUS_KM) {
    return {
      serviceable: false,
      charge: 0,
      message: `Delivery not available beyond ${MAX_DELIVERY_RADIUS_KM} km`,
    };
  }

  const charge = calculateDeliveryCharge(distanceInKm);
  return {
    serviceable: true,
    charge,
    message: `Delivery charge: ₹${charge}`,
  };
};

// ==========================================
// Helper Functions
// ==========================================

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const checkServiceability = async (lat: number, lng: number): Promise<{ serviceable: boolean; shopsCount: number; maxDistance?: number }> => {
  try {
    const response = await axios.get(`${API_URL}/location/check-serviceability`, {
      params: { lat, lng, radius: MAX_DELIVERY_RADIUS_KM },
    });
    return response.data;
  } catch (error) {
    console.error('Serviceability check failed:', error);
    return { serviceable: false, shopsCount: 0 };
  }
};

// ==========================================
// Location Store Interface & Implementation
// ==========================================

interface SavedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  source: 'gps' | 'manual';
  updatedAt?: string;
}

interface LocationStore {
  location: SavedLocation | null;
  recentLocations: SavedLocation[];
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
  isServiceable: boolean | null;
  nearestShopDistance: number | null;
  deliveryCharge: number | null;
  setPermissionStatus: (status: LocationStore['permissionStatus']) => void;
  setLocation: (location: SavedLocation) => void;
  setServiceable: (status: boolean) => void;
  setNearestShopDistance: (distance: number | null) => void;
  setDeliveryCharge: (charge: number | null) => void;
  addRecentLocation: (location: SavedLocation) => void;
  clearLocation: () => void;
  clearRecentLocations: () => void;
  validateAndSetServiceability: (lat: number, lng: number) => Promise<boolean>;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      location: null,
      recentLocations: [],
      permissionStatus: 'prompt',
      isServiceable: null,
      nearestShopDistance: null,
      deliveryCharge: null,

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      setServiceable: (status) => set({ isServiceable: status }),

      setNearestShopDistance: (distance) => set({ nearestShopDistance: distance }),

      setDeliveryCharge: (charge) => set({ deliveryCharge: charge }),

      setLocation: (location) => {
        const locationWithTimestamp = {
          ...location,
          updatedAt: new Date().toISOString(),
        };
        set({ location: locationWithTimestamp });
        get().addRecentLocation(locationWithTimestamp);
      },

      addRecentLocation: (location) => {
        const { recentLocations } = get();
        const exists = recentLocations.some(
          (loc) =>
            Math.abs(loc.latitude - location.latitude) < 0.0001 &&
            Math.abs(loc.longitude - location.longitude) < 0.0001
        );
        if (!exists) {
          const updated = [location, ...recentLocations].slice(0, 5);
          set({ recentLocations: updated });
        }
      },

      clearLocation: () => set({ location: null, isServiceable: null, nearestShopDistance: null, deliveryCharge: null }),

      clearRecentLocations: () => set({ recentLocations: [] }),

      validateAndSetServiceability: async (lat: number, lng: number) => {
        try {
          const result = await checkServiceability(lat, lng);
          set({ isServiceable: result.serviceable });
          
          if (result.serviceable && result.maxDistance !== undefined) {
            set({ nearestShopDistance: result.maxDistance });
            const charge = calculateDeliveryCharge(result.maxDistance);
            set({ deliveryCharge: charge });
          }
          
          return result.serviceable;
        } catch (error) {
          set({ isServiceable: false });
          return false;
        }
      },
    }),
    {
      name: 'localkart-location',
    }
  )
);

export const useCurrentLocation = () => useLocationStore((state) => state.location);
export const useIsServiceable = () => useLocationStore((state) => state.isServiceable);
export const usePermissionStatus = () => useLocationStore((state) => state.permissionStatus);
export const useDeliveryCharge = () => useLocationStore((state) => state.deliveryCharge);
export const useNearestShopDistance = () => useLocationStore((state) => state.nearestShopDistance);
