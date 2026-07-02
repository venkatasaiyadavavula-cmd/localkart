'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Phone, Lock, ArrowRight, Loader2, Store, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/hooks/use-auth';
import { AuthIntentShell } from '@/components/auth/auth-intent-shell';
import {
  getAuthTheme,
  parseAuthIntent,
  preserveAuthQuery,
} from '@/lib/auth-routes';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be 10 digits').max(10),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = parseAuthIntent(searchParams.get('intent'));
  const theme = getAuthTheme(intent);
  const redirectParam = searchParams.get('redirect');
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

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
  const authQuery = preserveAuthQuery(intent, redirectParam);
  const registerHref = `/register?${authQuery}`;

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.phone, data.password, data.rememberMe);
      toast.success(intent === 'seller' ? 'Welcome back, Seller!' : 'Welcome back!');
      const redirect =
        redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : theme.defaultRedirect;
      router.push(redirect);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <AuthIntentShell intent={intent}>
      <div>
        <div className="mb-8 text-center lg:text-left">
          <h1
            className="font-heading text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: 'var(--font-display, Syne, sans-serif)' }}
          >
            {theme.headline}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{theme.subline}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="9876543210" className="pl-10" {...register('phone')} />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: theme.accent }}>
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

          <Button
            type="submit"
            className="w-full border-0 text-white"
            size="lg"
            disabled={isSubmitting || isLoading}
            style={{ background: theme.buttonGradient }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                {intent === 'seller' ? 'Sign In to Seller Portal' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={registerHref} className="font-semibold hover:underline" style={{ color: theme.accent }}>
              Create account
            </Link>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Link
            href={intent === 'seller' ? theme.oppositeLogin : theme.oppositeLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/50"
          >
            {intent === 'seller' ? (
              <>
                <ShoppingBag className="h-4 w-4" />
                {theme.oppositeLabel}
              </>
            ) : (
              <>
                <Store className="h-4 w-4" />
                {theme.oppositeLabel}
              </>
            )}
          </Link>
        </div>
      </div>
    </AuthIntentShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
