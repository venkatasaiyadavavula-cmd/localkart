'use client';

import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkerIdentityProps {
  name: string;
  staffId: string;
  shopName?: string;
  variant?: 'hero' | 'compact' | 'sidebar';
  className?: string;
}

export function formatWorkerHandle(staffId: string) {
  const id = staffId.trim();
  return id.startsWith('@') ? id : `@${id}`;
}

export function WorkerIdentity({ name, staffId, shopName, variant = 'compact', className }: WorkerIdentityProps) {
  const handle = formatWorkerHandle(staffId);

  if (variant === 'hero') {
    return (
      <div className={cn('text-center', className)}>
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-3xl font-black text-white shadow-lg">
          {name[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {name}
        </h2>
        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
          <BadgeCheck className="h-4 w-4" />
          {handle}
        </p>
        {shopName && <p className="mt-2 text-sm text-white/75">{shopName}</p>}
        <p className="mt-3 text-[11px] text-white/60">Logged in as this work account</p>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('', className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-black text-white">
            {name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-900">{name}</p>
            <p className="truncate text-xs font-bold text-emerald-600">{handle}</p>
            {shopName && <p className="truncate text-[11px] text-gray-400">{shopName}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
        {name[0]?.toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-gray-900">{name}</p>
        <p className="truncate text-xs font-extrabold text-emerald-600">{handle}</p>
      </div>
    </div>
  );
}
