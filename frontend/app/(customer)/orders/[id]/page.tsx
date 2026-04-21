'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  Store,
  Phone,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronLeft,
  Copy,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useOrder } from '@/hooks/use-order';
import { useCancelOrder } from '@/hooks/use-cancel-order';
import { formatPrice } from '@/lib/utils';
import { OrderStatus, statusColors, statusLabels } from '@/types/order';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { data: order, isLoading, refetch } = useOrder(orderId);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied');
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      setShowCancelDialog(false);
      refetch();
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    try {
      // Call API to verify OTP
      await fetch(`/api/orders/${orderId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      toast.success('Order confirmed successfully');
      setShowOtpDialog(false);
      refetch();
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const canCancel = order && ['pending_otp', 'confirmed', 'processing'].includes(order.status);
  const canReturn = order && order.status === 'delivered' && !order.returnRequest;

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl font-bold sm:text-2xl">
                Order #{order.orderNumber}
              </h1>
              <button onClick={handleCopyOrderNumber} className="text-muted-foreground hover:text-primary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
        </div>
        <Badge className={statusColors[order.status] + ' px-3 py-1 text-sm'}>
          {statusLabels[order.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Progress */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold">Order Progress</h2>
              <div className="mt-6">
                <OrderTimeline status={order.status} />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <Link href={`/shop/${order.shop.slug}`} className="font-medium hover:text-primary">
                  {order.shop.name}
                </Link>
              </div>

              <div className="mt-4 space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/product/${item.productId}`} className="font-medium hover:text-primary">
                        {item.productName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatPrice(item.pricePerUnit)}
                      </p>
                      <p className="mt-1 font-medium">{formatPrice(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold">Delivery Address</h2>
              <div className="mt-3 space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  {order.shippingAddress.pincode}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold">Price Summary</h2>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatPrice(order.deliveryCharge)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shop Contact */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold">Shop Contact</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.shop.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {order.shop.openingTime} - {order.shop.closingTime}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              {order.status === 'pending_otp' && (
                <Alert className="mb-4">
                  <AlertDescription>
                    Confirm your order by entering the OTP sent to your phone.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                {order.status === 'pending_otp' && (
                  <Button className="w-full" onClick={() => setShowOtpDialog(true)}>
                    Verify OTP to Confirm
                  </Button>
                )}
                {canCancel && (
                  <Button variant="outline" className="w-full" onClick={() => setShowCancelDialog(true)}>
                    Cancel Order
                  </Button>
                )}
                {canReturn && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/returns/${order.id}`}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Request Return
                    </Link>
                  </Button>
                )}
                {order.status === 'out_for_delivery' && (
                  <Button className="w-full" onClick={() => setShowOtpDialog(true)}>
                    Confirm Delivery
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={isCancelling}>
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {order.status === 'pending_otp' ? 'Confirm Order' : 'Confirm Delivery'}
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to your registered phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={otp.length !== 6 || isVerifying}>
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify OTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const steps = [
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-5 h-full w-0.5 -translate-x-1/2 bg-muted" />
      <div className="space-y-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.key} className="relative flex items-start gap-4">
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? 'border-primary bg-primary text-white'
                    : 'border-muted-foreground/30 bg-card text-muted-foreground'
                }`}
              >
                <StepIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {isCurrent && <p className="text-sm text-muted-foreground">In progress</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="container py-6 md:py-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
