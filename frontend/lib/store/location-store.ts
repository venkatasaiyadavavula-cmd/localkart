import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// కడప జిల్లా కేంద్రం (యాప్ ఓపెన్ అయినప్పుడు డిఫాల్ట్ గా చూపించడానికి)
export const KADAPA_CENTER = {
  lat: 14.4673,
  lng: 78.8242,
};

// గరిష్ట డెలివరీ దూరం (కి.మీ.లలో)
export const MAX_DELIVERY_RADIUS_KM = 20;

// ==========================================
// Helper Functions
// ==========================================

/**
 * రెండు జీపీఎస్ పాయింట్ల మధ్య దూరాన్ని కి.మీ.లలో లెక్కిస్తుంది
 */
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

/**
 * బ్యాకెండ్ కి కాల్ చేసి, యూజర్ లొకేషన్ కి దగ్గరలో డెలివరీ చేసే షాపులు ఉన్నాయో లేదో చూస్తుంది
 */
export const checkServiceability = async (lat: number, lng: number): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/location/check-serviceability`, {
      params: { lat, lng, radius: MAX_DELIVERY_RADIUS_KM },
    });
    // Backend returns { serviceable: true, shopsCount: 3 }
    return response.data?.serviceable || false;
  } catch (error) {
    console.error('Serviceability check failed:', error);
    return false;
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
  isServiceable: boolean | null; // దగ్గరలో షాపులు ఉన్నాయా?
  setPermissionStatus: (status: LocationStore['permissionStatus']) => void;
  setLocation: (location: SavedLocation) => void;
  setServiceable: (status: boolean) => void;
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

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      setServiceable: (status) => set({ isServiceable: status }),

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

      clearLocation: () => set({ location: null, isServiceable: null }),

      clearRecentLocations: () => set({ recentLocations: [] }),

      validateAndSetServiceability: async (lat: number, lng: number) => {
        try {
          const serviceable = await checkServiceability(lat, lng);
          set({ isServiceable: serviceable });
          return serviceable;
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
