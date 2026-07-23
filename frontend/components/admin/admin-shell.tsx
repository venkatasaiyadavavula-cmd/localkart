'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminNavLinks } from '@/components/admin/admin-nav-links';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0 sm:max-w-xs">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="flex h-16 items-center border-b px-4">
            <Link
              href="/admin"
              className="flex items-center gap-2"
              onClick={() => setMobileNavOpen(false)}
            >
              <Image
                src="/logo.svg"
                alt="LocalKart"
                width={100}
                height={32}
                className="h-7 w-auto"
              />
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Admin
              </span>
            </Link>
          </div>
          <AdminNavLinks onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
