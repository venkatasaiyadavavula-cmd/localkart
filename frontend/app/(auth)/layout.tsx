import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Login or register to LocalKart',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      {/* Back to home link */}
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary sm:left-8 sm:top-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="LocalKart"
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Main card */}
          <div className="rounded-2xl bg-card p-6 shadow-soft-xl sm:p-8">
            {children}
          </div>

          {/* Footer links */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to LocalKart&apos;s{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-primary">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
