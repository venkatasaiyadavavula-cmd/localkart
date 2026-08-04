'use client';

import { Info } from 'lucide-react';

/**
 * Tab-level banner for seller/staff orders when COD orders await OTP confirmation.
 */
export function SellerPendingOtpBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex gap-2 items-start">
      <Info className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-900 leading-relaxed">
        <span className="font-semibold">{count} order{count === 1 ? '' : 's'}</span> need a customer OTP
        before you can accept them. The customer got the code by SMS when they placed the order — enter it
        on each order card below (or have delivery staff enter it at the door).
      </p>
    </div>
  );
}
