import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'seller' | 'admin';
  shopId?: string;
}

export async function getServerSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  try {
    const { API_URL } = await import('@/lib/api-config');
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const user = data.data ?? data;
    return {
      user: {
        ...user,
        shopId: user.shop?.id ?? user.shopId,
      },
    };
  } catch (error) {
    console.error('Session fetch error:', error);
    return null;
  }
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
