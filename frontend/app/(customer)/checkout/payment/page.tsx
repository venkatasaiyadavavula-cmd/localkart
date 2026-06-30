'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RazorpayButton } from '@/components/payment/razorpay-button';
import { formatPrice } from '@/lib/utils';
import { useOrder } from '@/hooks/use-order';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !amount) {
      router.push('/checkout');
      return;
    }
    setLoading(false);
  }, [orderId, amount, router]);

  const handlePaymentSuccess = () => {
    toast.success('Payment successful!');
    router.push(`/orders/${orderId}`);
  };

  const handlePaymentError = (error: any) => {
    toast.error(error.message || 'Payment failed');
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => router.push('/checkout')}>
          Back to Checkout
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold">Secure Payment</h1>
          <p className="mt-2 text-muted-foreground">
            Complete your payment securely via Razorpay
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-heading text-4xl font-bold text-primary">
                {formatPrice(parseFloat(amount || '0'))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Order #{orderId?.slice(0, 8)}
              </p>
            </div>

            <div className="space-y-4">
              <RazorpayButton
                orderId={orderId!}
                amount={parseFloat(amount!)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/checkout')}
              >
                Back to Checkout
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span>🔒 256-bit SSL Secure</span>
              <span>💳 All major cards accepted</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
