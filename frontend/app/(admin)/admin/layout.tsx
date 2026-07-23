import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { getServerSession, hasAccessTokenCookie } from '@/lib/auth';
import { authTrace } from '@/lib/auth-trace';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Admin | LocalKart',
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasToken = hasAccessTokenCookie();
  const session = await getServerSession();

  if (!session) {
    if (!hasToken) {
      authTrace('admin-layout', { action: 'redirect-login', reason: 'no-token' });
      redirect('/login?redirect=/admin');
    }
    authTrace('admin-layout', { action: 'defer-client', reason: 'session-unresolved' });
  } else if (session.user.role !== 'admin') {
    authTrace('admin-layout', { action: 'redirect-home', role: session.user.role });
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
