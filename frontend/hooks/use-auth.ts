import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiClient, clearLocalAuthSession } from '@/lib/api/client';
import { useCartStore } from '@/store/cart-store';
import { authTrace } from '@/lib/auth-trace';

const setAuthCookie = (accessToken: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
};

const clearAuthCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'accessToken=; path=/; max-age=0';
  }
};

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'seller' | 'admin';
  isPhoneVerified: boolean;
  profileImage?: string;
  shopId?: string;
  address?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (phone: string, mode?: string, orderId?: string | null) => Promise<void>;
  verifyOtp: (phone: string, otp: string, mode?: string, orderId?: string | null) => Promise<any>;
  setUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
  refreshSession: () => Promise<void>;
}

function mapProfileToUser(profile: Record<string, unknown>): User {
  const shop = profile.shop as { id?: string } | undefined;
  return {
    id: profile.id as string,
    name: profile.name as string,
    phone: profile.phone as string,
    email: profile.email as string | undefined,
    role: profile.role as User['role'],
    isPhoneVerified: (profile.isPhoneVerified as boolean) ?? false,
    profileImage: profile.profileImage as string | undefined,
    shopId: (profile.shopId as string | undefined) ?? shop?.id,
    address: profile.address as string | undefined,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      refreshSession: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const { data } = await apiClient.post('/auth/refresh', { refreshToken });
            const payload = data.data ?? data;
            if (payload?.accessToken) {
              localStorage.setItem('accessToken', payload.accessToken);
              if (payload.refreshToken) {
                localStorage.setItem('refreshToken', payload.refreshToken);
              }
              setAuthCookie(payload.accessToken);
            }
          } catch {
            // Profile fetch below still updates client user state.
          }
        }

        const { data } = await apiClient.get('/users/profile');
        const profile = (data.data ?? data) as Record<string, unknown>;
        const user = mapProfileToUser(profile);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      login: async (phone, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/login', { phone, password });
          const { accessToken, refreshToken, user } = data.data || data;
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          setAuthCookie(accessToken);
          set({ user, isAuthenticated: true, isLoading: false });
          useCartStore.getState().syncWithServer().catch(() => {});
        } catch (error: any) {
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
            // Prevents a lingering old session from being used for seller onboarding
            // (e.g. createShop) under the wrong account after registering a new phone.
            try {
              await apiClient.post('/auth/logout', {});
            } catch {
              // Best-effort — prior session may already be invalid or wrong user.
            }
            clearLocalAuthSession();
            clearAuthCookie();
            set({ user: null, isAuthenticated: false });
          }

          const payload = { ...data };
          if (!payload.email) delete payload.email;
          const response = await apiClient.post('/auth/register', payload);
          if (!response.data) {
            throw new Error('Registration failed');
          }

          // Registration does not log the user in — ensure no stale token remains.
          clearLocalAuthSession();
          clearAuthCookie();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/logout', {});
        } finally {
          clearLocalAuthSession();
          clearAuthCookie();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      sendOtp: async (phone, mode = 'register', orderId = null) => {
        await apiClient.post('/auth/send-otp', { phone, mode, orderId });
        toast.success('OTP sent successfully');
      },

      verifyOtp: async (phone, otp, mode = 'register', orderId = null) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/verify-otp', { phone, otp, mode, orderId });
          const { accessToken, refreshToken, user } = data.data || data;
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            setAuthCookie(accessToken);
            set({ user, isAuthenticated: true });
            useCartStore.getState().syncWithServer().catch(() => {});
          }
          set({ isLoading: false });
          return data.data;
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'localkart-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => {
        authTrace('rehydrate-start', { storageKey: 'localkart-auth' });
        return (state) => {
          if (state) {
            state.isLoading = false;
            state.setHasHydrated(true);
            authTrace('rehydrate-done', {
              isAuthenticated: state.isAuthenticated,
              role: state.user?.role ?? null,
            });
          }
        };
      },
    }
  )
);

export const useAuth = () => {
  const store = useAuthStore();
  return store;
};
