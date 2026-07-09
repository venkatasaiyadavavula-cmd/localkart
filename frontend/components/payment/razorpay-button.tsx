'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { unwrapApiData } from '@/lib/utils';
import { API_URL } from '@/lib/api-config';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayButtonProps {
  orderId: string;
  amount: number;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function RazorpayButton({
  orderId,
  amount,
  onSuccess,
  onError,
  className,
  variant = 'default',
  size = 'lg',
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create Razorpay order from backend
      const token = localStorage.getItem('accessToken');
      const { data: raw } = await axios.post(
        `${API_URL}/payments/create-order`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = unwrapApiData<{
        orderId: string;
        amount: number | string;
        currency: string;
        key?: string;
      }>(raw);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your connection.');
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'LocalKart',
        description: `Payment for Order #${orderId.slice(0, 8)}`,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyToken = localStorage.getItem('accessToken');
            await axios.post(
              `${API_URL}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internalOrderId: orderId,
              },
              { headers: { Authorization: `Bearer ${verifyToken}` } }
            );
            onSuccess(response);
          } catch (error) {
            onError(error);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#0B63E5',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment. Please try again.');
      onError(error);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ₹{amount.toLocaleString('en-IN')}
        </>
      )}
    </Button>
  );
}
