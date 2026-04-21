'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ArrowRight, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/use-auth';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const mode = searchParams.get('mode') || 'register'; // 'register', 'login', 'order'
  const orderId = searchParams.get('orderId');

  const { verifyOtp, sendOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!phone && mode !== 'order') {
      toast.error('Phone number is required');
      router.push('/login');
    }
  }, [phone, mode, router]);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(30);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyOtp(phone, otp, mode, orderId);
      
      if (mode === 'register') {
        toast.success('Phone verified successfully! You can now login.');
        router.push('/login');
      } else if (mode === 'login') {
        toast.success('Login successful!');
        router.push('/');
      } else if (mode === 'order') {
        toast.success('Order confirmed!');
        router.push(`/orders/${orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setIsResending(true);
    try {
      if (mode === 'order' && orderId) {
        // Resend order confirmation OTP
        await sendOtp(phone, 'order', orderId);
      } else {
        await sendOtp(phone, mode);
      }
      toast.success('OTP resent successfully');
      startCountdown();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const getTitleAndDescription = () => {
    switch (mode) {
      case 'register':
        return {
          title: 'Verify Your Phone',
          description: 'Enter the 6-digit code sent to your phone to complete registration.',
        };
      case 'login':
        return {
          title: 'Login with OTP',
          description: 'Enter the 6-digit code sent to your phone to sign in.',
        };
      case 'order':
        return {
          title: 'Confirm Your Order',
          description: 'Enter the 6-digit OTP sent to your phone to confirm this order.',
        };
      default:
        return {
          title: 'Verify OTP',
          description: 'Enter the 6-digit verification code.',
        };
    }
  };

  const { title, description } = getTitleAndDescription();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {phone && (
          <p className="mt-1 text-sm font-medium text-primary">
            Sent to +91 {phone}
            <button
              onClick={() => router.push(mode === 'order' ? `/checkout` : `/login`)}
              className="ml-2 text-xs text-muted-foreground hover:underline"
            >
              (Change)
            </button>
          </p>
        )}
      </div>

      <div className="space-y-8">
        {/* OTP Input */}
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isVerifying || isResending}
            autoFocus
          >
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

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          className="w-full"
          size="lg"
          disabled={isVerifying || isResending || otp.length !== 6}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?{' '}
            {canResend ? (
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                Resend in {countdown}s
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Back Link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href={mode === 'order' ? '/checkout' : '/login'}
          className="hover:text-primary hover:underline"
        >
          ← Back
        </Link>
      </p>
    </motion.div>
  );
}
