'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Something went wrong!</h1>
            <p className="mt-2 text-muted-foreground">
              We apologize for the inconvenience. Our team has been notified.
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
