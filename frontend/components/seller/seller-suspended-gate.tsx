'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth';
import { SellerSuspendedScreen } from '@/components/seller/seller-suspended-screen';

type ShopProfile = { name?: string; status?: string };

export function SellerSuspendedGate({
  children,
  initialSuspended,
  initialShopName,
}: {
  children: React.ReactNode;
  initialSuspended?: boolean;
  initialShopName?: string;
}) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [suspended, setSuspended] = useState(initialSuspended ?? false);
  const [shopName, setShopName] = useState(initialShopName);

  const needsClientCheck = _hasHydrated && isAuthenticated && user?.role === 'seller' && !initialSuspended;

  const { data: shop, isLoading } = useQuery<ShopProfile>({
    queryKey: ['seller', 'shop', 'suspend-gate'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/shop');
      return unwrapApiData<ShopProfile>(data);
    },
    enabled: needsClientCheck,
    retry: false,
  });

  useEffect(() => {
    if (initialSuspended) {
      setSuspended(true);
      return;
    }
    if (shop?.status === 'suspended') {
      setSuspended(true);
      setShopName(shop.name);
    }
  }, [initialSuspended, shop]);

  if (initialSuspended) {
    return <SellerSuspendedScreen shopName={initialShopName} />;
  }

  if (needsClientCheck && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (suspended) {
    return <SellerSuspendedScreen shopName={shopName} />;
  }

  return <>{children}</>;
}
