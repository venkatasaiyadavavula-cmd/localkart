'use client';

import { cn } from '@/lib/utils';

interface ShopOpenBadgeProps {
  isOpen: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function ShopOpenBadge({ isOpen, className, size = 'sm' }: ShopOpenBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        isOpen
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200',
        className,
      )}
    >
      <span
        className={cn(
          'rounded-full mr-1.5',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          isOpen ? 'bg-green-500' : 'bg-gray-400',
        )}
      />
      {isOpen ? 'Open' : 'Closed'}
    </span>
  );
}
