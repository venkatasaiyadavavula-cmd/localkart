'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AdminNavLinks } from '@/components/admin/admin-nav-links';

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="LocalKart" width={100} height={32} className="h-7 w-auto" />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Admin
          </span>
        </Link>
      </div>
      <AdminNavLinks />
    </aside>
  );
}
