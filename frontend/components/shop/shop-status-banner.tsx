'use client';

import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ShopStatusBannerProps {
  isCurrentlyOpen?: boolean;
  statusMessage?: string;
  className?: string;
}

export function ShopStatusBanner({
  isCurrentlyOpen,
  statusMessage,
  className,
}: ShopStatusBannerProps) {
  if (isCurrentlyOpen === undefined) {
    return null;
  }

  if (isCurrentlyOpen) {
    return (
      <Alert className={cn('border-green-200 bg-green-50', className)}>
        <Clock className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Shop is Open</AlertTitle>
        <AlertDescription className="text-green-700">
          {statusMessage || 'Orders are being accepted now.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={cn('border-red-200 bg-red-50', className)}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Shop is Currently Closed</AlertTitle>
      <AlertDescription className="text-red-700">
        {statusMessage || 'You can browse products, but ordering is unavailable right now.'}
      </AlertDescription>
    </Alert>
  );
}
