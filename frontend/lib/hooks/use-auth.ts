import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { RegisterData } from '@/lib/api/auth';
import { clearLocalAuthSession } from '@/lib/api/client';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'seller' | 'admin';
  isPhoneVerified: boolean;
  profileImage?: string;
  shopId?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string, mode?: string, orderId?: string) => Promise<any>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (phone, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const { user } = await authApi.login({ phone, password });
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const hadSession =
            typeof window !== 'undefined' &&
            (localStorage.getItem('accessToken') || get().isAuthenticated);

          if (hadSession) {
            try {
              await authApi.logout();
            } catch {
              // Best-effort logout before registering under a different account.
            }
            clearLocalAuthSession();
            set({ user: null, isAuthenticated: false });
          }

          const result = await authApi.register(data);
          clearLocalAuthSession();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return result;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          clearLocalAuthSession();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      sendOtp: async (phone) => {
        return authApi.sendOtp(phone);
      },

      verifyOtp: async (phone, otp, mode, orderId) => {
        set({ isLoading: true });
        try {
          const { user } = await authApi.verifyOtp({ phone, otp });
          if (user) {
            set({ user, isAuthenticated: true });
          }
          set({ isLoading: false });
          return { user };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshUser: async () => {
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'localkart-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// React hook wrapper
export const useAuth = () => {
  const store = useAuthStore();
  return store;
};
