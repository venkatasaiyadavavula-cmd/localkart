'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { adminNavItems } from './admin-nav';

interface AdminNavLinksProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminNavLinks({ onNavigate, className }: AdminNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex flex-col gap-1 p-2', className)}>
      {adminNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
