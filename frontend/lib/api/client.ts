import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-config';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data ?? response.data;
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        const path = window.location.pathname;
        const intent = path.startsWith('/dashboard') || path.startsWith('/seller') ? 'seller' : 'customer';
        const redirect = path.startsWith('/login') ? '/' : path;
        window.location.href = `/login?intent=${intent}&redirect=${encodeURIComponent(redirect)}`;
        toast.error('Session expired. Please login again.');
      }
    }

    // Handle other errors
    const message = error.response?.data?.message || error.message || 'An error occurred';
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Helper function to set auth tokens
export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// Helper function to clear auth tokens
export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Helper function to get stored token
export const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
