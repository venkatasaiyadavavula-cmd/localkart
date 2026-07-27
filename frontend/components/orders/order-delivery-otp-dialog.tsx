'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onVerify: (otp: string) => Promise<void>;
};

export function OrderDeliveryOtpDialog({
  open,
  onOpenChange,
  title = 'Confirm with OTP',
  description = 'Enter the OTP sent to the customer\'s phone.',
  confirmLabel = 'Confirm',
  onVerify,
}: Props) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!open) setOtp('');
  }, [open]);

  const handleVerify = async () => {
    if (otp.length < 4) return;
    setIsVerifying(true);
    try {
      await onVerify(otp);
      onOpenChange(false);
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleVerify} disabled={isVerifying || otp.length < 4}>
            {isVerifying ? 'Verifying...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
