import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setLocation: (location: SavedLocation) => void;
  addRecentLocation: (location: SavedLocation) => void;
  clearLocation: () => void;
  clearRecentLocations: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      location: null,
      recentLocations: [],

      setLocation: (location) => {
        const locationWithTimestamp = {
          ...location,
          updatedAt: new Date().toISOString(),
        };
        set({ location: locationWithTimestamp });
        // Also add to recent locations
        get().addRecentLocation(locationWithTimestamp);
      },

      addRecentLocation: (location) => {
        const { recentLocations } = get();
        // Avoid duplicates based on coordinates
        const exists = recentLocations.some(
          (loc) =>
            Math.abs(loc.latitude - location.latitude) < 0.0001 &&
            Math.abs(loc.longitude - location.longitude) < 0.0001
        );
        if (!exists) {
          const updated = [location, ...recentLocations].slice(0, 5); // Keep last 5
          set({ recentLocations: updated });
        }
      },

      clearLocation: () => set({ location: null }),

      clearRecentLocations: () => set({ recentLocations: [] }),
    }),
    {
      name: 'localkart-location',
    }
  )
);

// Selector hooks
export const useCurrentLocation = () => useLocationStore((state) => state.location);
export const useRecentLocations = () => useLocationStore((state) => state.recentLocations);
