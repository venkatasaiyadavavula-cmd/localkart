'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfferCountdownProps {
  expiresAt: string | Date;
  urgentClassName?: string;
  className?: string;
  showIcon?: boolean;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

export function OfferCountdown({
  expiresAt,
  urgentClassName,
  className,
  showIcon = true,
}: OfferCountdownProps) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(formatRemaining(target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const urgent = remaining.includes('m') && !remaining.includes('h') && parseInt(remaining, 10) < 60;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold',
        urgent ? urgentClassName || 'text-red-600' : 'text-muted-foreground',
        className,
      )}
    >
      {showIcon && <Clock className="h-3 w-3" />}
      {remaining}
    </span>
  );
}
