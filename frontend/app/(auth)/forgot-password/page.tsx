'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, KeyRound, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { buildLoginUrl } from '@/lib/auth-routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { phone, mode: 'reset_password' });
      toast.success('OTP sent to your WhatsApp');
      setStep('reset');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { phone, otp, newPassword });
      toast.success('Password reset! Please login.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4 inline-flex">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-sm text-gray-500">
            {step === 'phone'
              ? 'Enter your registered phone number to receive OTP on WhatsApp'
              : 'Enter OTP and choose a new password'}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  className="pl-10"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <Button className="w-full" onClick={sendOtp} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send OTP'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>OTP</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="justify-center w-full">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={resetPassword} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : 'Reset Password'}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-primary font-semibold"
              onClick={() => { setStep('phone'); setOtp(''); }}
            >
              Resend OTP to {phone}
            </button>
          </div>
        )}

        <Link href={buildLoginUrl({ intent: 'customer' })} className="flex items-center justify-center gap-1 text-sm text-primary font-semibold">
          <ChevronLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}
