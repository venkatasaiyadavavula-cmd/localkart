'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/checkout');
  }, [router]);

  return (
    <div className="container py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Online payments unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            LocalKart currently supports Cash on Delivery only. Redirecting you back to checkout...
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push('/checkout')}>
            Back to Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
