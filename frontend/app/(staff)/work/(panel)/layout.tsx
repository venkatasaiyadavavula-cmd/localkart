'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { staffWorkApi } from '@/lib/api/staff-work';
import { WorkerIdentity } from '@/components/work/worker-identity';
import { Package, Truck, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/work', label: 'Dashboard', icon: LayoutDashboard, perm: null },
  { href: '/work/products', label: 'Products', icon: Package, perm: 'products:read' },
  { href: '/work/orders', label: 'Deliveries', icon: Truck, perm: 'orders:read' },
];

export default function WorkPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, staff, logout, hasPermission } = useStaffAuth();

  const { error } = useQuery({
    queryKey: ['staff', 'me'],
    queryFn: () => staffWorkApi.getProfile(),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) router.replace('/work/login');
  }, [token, router]);

  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      logout();
      router.replace('/work/login');
    }
  }, [error, logout, router]);

  if (!token || !staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">
        <div className="border-b p-4">
          <WorkerIdentity
            variant="sidebar"
            name={staff.name}
            staffId={staff.staffId}
            shopName={staff.shopName}
          />
          <span className="mt-3 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Work Account Active
          </span>
        </div>
        <nav className="space-y-1 p-2">
          {nav
            .filter((item) => !item.perm || hasPermission(item.perm))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
        </nav>
        <button
          onClick={() => { logout(); router.push('/work/login'); }}
          className="absolute bottom-4 left-2 right-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <header className="sticky top-0 z-20 border-b bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <WorkerIdentity variant="compact" name={staff.name} staffId={staff.staffId} />
          <button onClick={() => { logout(); router.push('/work/login'); }} className="text-xs font-semibold text-gray-500">
            Sign out
          </button>
        </div>
        <p className="mt-1 truncate text-[11px] text-gray-400">{staff.shopName}</p>
      </header>

      <main className="mx-auto max-w-4xl p-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t bg-white lg:hidden">
        {nav
          .filter((item) => !item.perm || hasPermission(item.perm))
          .map((item) => (
            <Link key={item.href} href={item.href} className={cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-gray-500')}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
      </nav>
    </div>
  );
}
