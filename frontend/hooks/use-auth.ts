import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
  login: (phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (phone: string, mode?: string, orderId?: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string, mode?: string, orderId?: string) => Promise<any>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/login', { phone, password });
          const { accessToken, refreshToken, user } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/register', data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/logout');
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      sendOtp: async (phone, mode, orderId) => {
        await apiClient.post('/auth/send-otp', { phone, mode, orderId });
      },

      verifyOtp: async (phone, otp, mode, orderId) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/verify-otp', { phone, otp, mode, orderId });
          const { accessToken, refreshToken, user } = response.data.data;
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            set({ user, isAuthenticated: true });
          }
          set({ isLoading: false });
          return response.data.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        try {
          const response = await apiClient.get('/users/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ user: response.data.data, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem('accessToken');
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

export const useAuth = () => {
  const store = useAuthStore();
  return store;
};
