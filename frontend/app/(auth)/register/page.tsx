'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Phone, Mail, Lock, ArrowRight, Loader2, Store, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/hooks/use-auth';
import { AuthIntentShell } from '@/components/auth/auth-intent-shell';
import {
  buildLoginUrl,
  getAuthTheme,
  parseAuthIntent,
  preserveAuthQuery,
} from '@/lib/auth-routes';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be 10 digits').max(10),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = parseAuthIntent(searchParams.get('intent'));
  const theme = getAuthTheme(intent);
  const redirectParam = searchParams.get('redirect');
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
  });

  const authQuery = preserveAuthQuery(intent, redirectParam);
  const loginHref = `/login?${authQuery}`;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...payload } = data;

      await registerUser({
        ...payload,
        role: 'customer',
      });

      toast.success('Account created! Please sign in to continue.');
      router.push(loginHref);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed. Please try again.');
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
            {theme.registerHeadline}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{theme.registerSubline}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" placeholder="John Doe" className="pl-10" {...register('name')} />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="9876543210" className="pl-10" {...register('phone')} />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="john@example.com" className="pl-10" {...register('email')} />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {intent === 'seller' && (
            <p
              className="rounded-xl border p-3 text-xs"
              style={{
                background: 'rgba(124,58,237,0.06)',
                borderColor: 'rgba(124,58,237,0.15)',
                color: '#5B21B6',
              }}
            >
              After sign-in you&apos;ll set up your shop profile and start listing products on LocalKart.
            </p>
          )}

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
                Creating account...
              </>
            ) : (
              <>
                {intent === 'seller' ? 'Create Seller Account' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href={loginHref} className="font-semibold hover:underline" style={{ color: theme.accent }}>
              Sign in
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
            href={intent === 'seller' ? buildLoginUrl({ intent: 'customer' }) : theme.oppositeLogin}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
