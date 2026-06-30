export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isPhoneVerified: boolean;
  isActive: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  shopId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role?: UserRole;
}

export interface OtpVerification {
  phone: string;
  otp: string;
}
