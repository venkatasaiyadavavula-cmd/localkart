import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authTrace } from '@/lib/auth-trace';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'seller' | 'admin';
  shopId?: string;
  shopName?: string | null;
  shopStatus?: string | null;
  shop?: { id?: string; name?: string; status?: string };
}

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProfile(
  token: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; status: number; transient: boolean }> {
  const { API_URL } = await import('@/lib/api-config');
  const response = await fetch(`${API_URL}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      transient: TRANSIENT_STATUS.has(response.status),
    };
  }

  const data = await response.json();
  const user = data.data ?? data;
  return {
    ok: true,
    user: {
      ...user,
      shopId: user.shop?.id ?? user.shopId,
      shopName: user.shop?.name ?? null,
      shopStatus: user.shop?.status ?? null,
    },
  };
}

export async function getServerSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    authTrace('server-session', { result: 'no-token' });
    return null;
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fetchProfile(token);
      if (result.ok) {
        authTrace('server-session', { result: 'ok', attempt, role: result.user.role });
        return { user: result.user };
      }

      authTrace('server-session', {
        result: 'profile-failed',
        attempt,
        status: result.status,
        transient: result.transient,
      });

      if (!result.transient || attempt === maxAttempts) {
        return null;
      }

      await sleep(150 * attempt);
    } catch (error) {
      authTrace('server-session', {
        result: 'fetch-error',
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt === maxAttempts) {
        return null;
      }
      await sleep(150 * attempt);
    }
  }

  return null;
}

/** True when the browser sent an accessToken cookie (session may still be validating). */
export function hasAccessTokenCookie(): boolean {
  const cookieStore = cookies();
  return !!cookieStore.get('accessToken')?.value;
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(role: 'seller' | 'admin') {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  if (session.user.role !== role) {
    redirect('/');
  }
  return session;
}
