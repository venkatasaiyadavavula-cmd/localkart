'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/hooks/use-staff-auth';

/** Redirect to /work when the staff session lacks required permission(s). */
export function useStaffRouteGuard(required: string | string[]) {
  const router = useRouter();
  const { hasPermission, _hasHydrated } = useStaffAuth();
  const perms = Array.isArray(required) ? required : [required];

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!perms.every((p) => hasPermission(p))) {
      router.replace('/work');
    }
  }, [_hasHydrated, hasPermission, router, perms]);
}
