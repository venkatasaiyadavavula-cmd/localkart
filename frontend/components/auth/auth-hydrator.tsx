'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

/** Sync persisted auth state with the server profile (role, shopId, etc.). */
export function AuthHydrator() {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    apiClient
      .get('/users/profile')
      .then(({ data }) => {
        const profile = unwrapApiData<{
          id: string;
          name: string;
          phone: string;
          email?: string;
          role: 'customer' | 'seller' | 'admin';
          isPhoneVerified?: boolean;
          profileImage?: string;
          address?: string;
          shopId?: string;
          shop?: { id?: string };
        }>(data);

        if (!profile?.id) return;

        const { user, setUser } = useAuthStore.getState();
        setUser({
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          email: profile.email ?? user?.email,
          role: profile.role ?? 'customer',
          isPhoneVerified: profile.isPhoneVerified ?? false,
          profileImage: profile.profileImage ?? user?.profileImage,
          shopId: profile.shop?.id ?? profile.shopId ?? user?.shopId,
          address: profile.address ?? user?.address,
        });
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          const { logout } = useAuthStore.getState();
          logout().catch(() => {});
        }
      });
  }, []);

  return null;
}
