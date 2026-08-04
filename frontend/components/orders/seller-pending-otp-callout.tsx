'use client';

import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onEnterOtp: () => void;
  className?: string;
};

/**
 * Explains COD pending_otp orders and surfaces the OTP entry action for sellers/staff.
 */
export function SellerPendingOtpCallout({ onEnterOtp, className }: Props) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2.5 ${className ?? ''}`}
    >
      <div className="flex items-start gap-2">
        <KeyRound className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-amber-900 leading-snug">
            Waiting for delivery OTP from customer to confirm this order
          </p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            COD orders stay here until confirmed. The customer received a 6-digit OTP on their phone when
            they ordered. Ask them for it (or collect it at delivery) and enter it here to move the order
            to <span className="font-medium">New</span> so you can accept and fulfill it.
          </p>
        </div>
      </div>
      <Button
        onClick={onEnterOtp}
        className="w-full h-11 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white border-0"
      >
        Enter customer OTP to confirm
      </Button>
    </div>
  );
}
