'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/hooks/use-auth';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be 10 digits').max(10),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, sendOtp, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.phone, data.password, data.rememberMe);
      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleSendOtp = async () => {
    if (otpPhone.length !== 10) {
      toast.error('Valid 10 digit phone number enter cheyandi');
      return;
    }
    setIsSendingOtp(true);
    try {
      await sendOtp(otpPhone, 'login');
      toast.success('OTP sent successfully!');
      router.push(`/verify-otp?phone=${otpPhone}&mode=login`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'OTP send cheyyadam fail ayyindi');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Welcome Back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              className="pl-10"
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
          />
          <Label htmlFor="remember" className="cursor-pointer font-normal">
            Remember me for 30 days
          </Label>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isLoading}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
          ) : (
            <>Sign In<ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>

      {/* OTP Login */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {!showOtpInput ? (
          <Button
            variant="outline"
            className="mt-4 w-full"
            size="lg"
            onClick={() => setShowOtpInput(true)}
          >
            Login with OTP
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <Label>Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="10 digit phone number"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                className="pl-10"
                maxLength={10}
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
              ) : (
                <>OTP Send Cheyandi<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <button
              onClick={() => setShowOtpInput(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary"
            >
              ← Password tho login cheyandi
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
