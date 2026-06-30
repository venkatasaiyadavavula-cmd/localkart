import { apiClient, setAuthTokens, clearAuthTokens } from './client';

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role?: 'customer' | 'seller';
}

export interface OtpData {
  phone: string;
  otp: string;
}

export const authApi = {
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data;
    setAuthTokens(accessToken, refreshToken);
    return { user };
  },

  async register(data: RegisterData) {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  async sendOtp(phone: string) {
    const response = await apiClient.post('/auth/send-otp', { phone });
    return response.data.data;
  },

  async verifyOtp(data: OtpData) {
    const response = await apiClient.post('/auth/verify-otp', data);
    const { accessToken, refreshToken, user } = response.data.data;
    if (accessToken) {
      setAuthTokens(accessToken, refreshToken);
    }
    return { user };
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuthTokens();
    }
  },

  async getCurrentUser() {
    const response = await apiClient.get('/users/profile');
    return response.data.data;
  },

  async updateProfile(data: any) {
    const response = await apiClient.put('/users/profile', data);
    return response.data.data;
  },
};
