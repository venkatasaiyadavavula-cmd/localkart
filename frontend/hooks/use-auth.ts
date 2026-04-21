import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { toast } from 'sonner';

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
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (phone, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/login', { phone, password });
          const { accessToken, refreshToken, user } = data.data;
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
          toast.success('Login successful');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Login failed');
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/register', data);
          set({ isLoading: false });
          toast.success('Registration successful. Please verify OTP.');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Registration failed');
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

      sendOtp: async (phone) => {
        await apiClient.post('/auth/send-otp', { phone });
        toast.success('OTP sent successfully');
      },

      verifyOtp: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/verify-otp', { phone, otp });
          const { accessToken, refreshToken, user } = data.data;
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            set({ user, isAuthenticated: true });
          }
          set({ isLoading: false });
          return data.data;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Invalid OTP');
          throw error;
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
