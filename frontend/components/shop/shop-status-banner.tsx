'use client';

import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ShopStatusBannerProps {
  openingTime?: string;
  closingTime?: string;
  className?: string;
}

export function ShopStatusBanner({ openingTime, closingTime, className }: ShopStatusBannerProps) {
  if (!openingTime || !closingTime) {
    return null;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;

  const isOpen = currentTime >= openTime && currentTime <= closeTime;

  if (isOpen) {
    return (
      <Alert className={cn('border-green-200 bg-green-50', className)}>
        <Clock className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Shop is Open</AlertTitle>
        <AlertDescription className="text-green-700">
          Orders placed now will be processed immediately. Delivery available until {closingTime}.
        </AlertDescription>
      </Alert>
    );
  }

  const nextOpen = new Date(now);
  if (now.getHours() > openHour || (now.getHours() === openHour && now.getMinutes() >= openMinute)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  nextOpen.setHours(openHour, openMinute, 0, 0);

  const timeUntilOpen = nextOpen.getTime() - now.getTime();
  const hoursUntilOpen = Math.floor(timeUntilOpen / (1000 * 60 * 60));
  const minutesUntilOpen = Math.floor((timeUntilOpen % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Alert className={cn('border-yellow-200 bg-yellow-50', className)}>
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Shop is Currently Closed</AlertTitle>
      <AlertDescription className="text-yellow-700">
        You can still place your order. It will be processed when the shop opens
        {hoursUntilOpen > 0 || minutesUntilOpen > 0 ? (
          <span> in <strong>{hoursUntilOpen}h {minutesUntilOpen}m</strong> (at {openingTime})</span>
        ) : (
          <span> at <strong>{openingTime}</strong></span>
        )}.
      </AlertDescription>
    </Alert>
  );
}
