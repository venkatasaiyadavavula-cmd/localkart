import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    pincode?: string;
    source: 'gps' | 'manual';
  } | null;
  setLocation: (location: LocationState['location']) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) => set({ location }),
      clearLocation: () => set({ location: null }),
    }),
    {
      name: 'localkart-location',
    }
  )
);
