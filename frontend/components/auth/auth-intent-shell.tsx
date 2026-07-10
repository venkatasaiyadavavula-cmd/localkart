'use client';

import Link from 'next/link';
import { ChevronLeft, ShoppingBag, Store } from 'lucide-react';
import { type AuthIntent, getAuthTheme } from '@/lib/auth-routes';
import { cn } from '@/lib/utils';

interface AuthIntentShellProps {
  intent: AuthIntent;
  children: React.ReactNode;
}

export function AuthIntentShell({ intent, children }: AuthIntentShellProps) {
  const theme = getAuthTheme(intent);
  const isSeller = intent === 'seller';

  return (
    <div className={cn('relative min-h-screen bg-gradient-to-br', theme.gradient)}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:left-8 sm:top-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:gap-10">
          {/* Brand panel — desktop */}
          <div
            className="relative hidden overflow-hidden rounded-3xl p-10 text-white lg:flex lg:flex-col lg:justify-between"
            style={{ background: theme.panelGradient, boxShadow: '0 24px 64px -12px rgba(0,0,0,0.35)' }}
          >
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: theme.accent }} />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: theme.accentSecondary }} />

            <div className="relative">
              <Link href="/" className="inline-block">
                <span className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display, Syne, sans-serif)' }}>
                  Local<span style={{ color: theme.accentSecondary }}>Kart</span>
                </span>
              </Link>
              <div
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-sm"
              >
                <span>{theme.badgeIcon}</span>
                {theme.badge}
              </div>
            </div>

            <div className="relative space-y-4">
              <h2 className="text-3xl font-black leading-tight" style={{ fontFamily: 'var(--font-display, Syne, sans-serif)' }}>
                {isSeller ? (
                  <>
                    Reach thousands of<br />
                    <span style={{ color: theme.accentSecondary }}>local customers</span>
                  </>
                ) : (
                  <>
                    Shop local.<br />
                    <span style={{ color: '#818CF8' }}>Delivered fast.</span>
                  </>
                )}
              </h2>
              <p className="max-w-sm text-sm text-white/70">
                {isSeller
                  ? 'List products, manage orders, track earnings — all from one powerful seller dashboard.'
                  : 'Discover groceries, fashion, electronics and more from trusted shops in Kadapa.'}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {(isSeller
                  ? ['Easy onboarding', 'Real-time orders', 'Analytics dashboard']
                  : ['Same-day delivery', 'Cash on delivery', 'Easy returns']
                ).map((item) => (
                  <span
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex items-center gap-3 text-xs text-white/50">
              {isSeller ? <Store className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              Trusted by local businesses across Andhra Pradesh
            </div>
          </div>

          {/* Form card */}
          <div className="w-full">
            <div className="mb-6 flex justify-center lg:hidden">
              <Link href="/" className="inline-block">
                <span className="text-2xl font-bold">
                  Local<span style={{ color: theme.accentSecondary }}>Kart</span>
                </span>
              </Link>
            </div>

            <div
              className="mb-4 flex justify-center lg:justify-start"
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
                style={{
                  background: isSeller ? 'rgba(124,58,237,0.10)' : 'rgba(61,90,241,0.10)',
                  color: theme.accent,
                  border: `1px solid ${isSeller ? 'rgba(124,58,237,0.20)' : 'rgba(61,90,241,0.20)'}`,
                }}
              >
                {theme.badgeIcon} {theme.badge}
              </span>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft-xl sm:p-8" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              {children}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to LocalKart&apos;s{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-primary">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
