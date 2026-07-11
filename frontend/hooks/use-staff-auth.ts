import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

import { API_URL as API } from '@/lib/api-config';

export interface StaffSession {
  id: string;
  name: string;
  staffId: string;
  role: string;
  shopName: string;
  permissions: string[];
}

interface StaffAuthState {
  token: string | null;
  staff: StaffSession | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (staffId: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useStaffAuth = create<StaffAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      staff: null,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (staffId, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.post(`${API}/seller/staff/login`, {
            staffId: staffId.trim().toLowerCase(),
            password,
          });
          const payload = data?.data ?? data;
          localStorage.setItem('staffAccessToken', payload.token);
          set({ token: payload.token, staff: payload.staff, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: () => {
        localStorage.removeItem('staffAccessToken');
        set({ token: null, staff: null });
      },

      hasPermission: (perm) => {
        const perms = get().staff?.permissions ?? [];
        return perms.includes(perm);
      },
    }),
    {
      name: 'staff-auth',
      partialize: (s) => ({ token: s.token, staff: s.staff }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    },
  ),
);

export function staffAuthHeaders() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('staffAccessToken') ?? useStaffAuth.getState().token
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
