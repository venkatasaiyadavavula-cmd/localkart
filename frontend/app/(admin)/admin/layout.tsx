import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
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
    // Cookie present but profile could not be validated (transient API failure).
    // Defer to client AuthGuard instead of falsely redirecting a logged-in admin.
    authTrace('admin-layout', { action: 'defer-client', reason: 'session-unresolved' });
  } else if (session.user.role !== 'admin') {
    authTrace('admin-layout', { action: 'redirect-home', role: session.user.role });
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
