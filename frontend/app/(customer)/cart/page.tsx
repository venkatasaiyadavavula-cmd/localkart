'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  Shield,
  Store,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems, isLoading } = useCartStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(productId);
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await removeItem(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/browse">Start Shopping</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const shopName = items[0]?.shopName || 'Shop';

  return (
    <div className="container py-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Shop Header */}
              <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-medium">{shopName}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>

              {/* Items List */}
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b last:border-b-0"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Product Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div>
                            <Link
                              href={`/product/${item.productId}`}
                              className="font-medium hover:text-primary"
                            >
                              {item.name}
                            </Link>
                            <p className="text-sm font-semibold text-primary">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={updatingId === item.productId}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            {updatingId === item.productId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingId === item.productId}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxQuantity || updatingId === item.productId}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-medium">
                            Total: {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/browse">Continue Shopping</Link>
            </Button>
            <Button variant="ghost" onClick={clearCart} className="text-muted-foreground">
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold">Order Summary</h2>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Charge</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-heading text-xl font-bold text-primary">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mt-6 space-y-3 rounded-lg bg-muted/30 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Same day delivery available</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Secure checkout</span>
                </div>
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                By placing your order, you agree to LocalKart's terms and conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="container py-6 md:py-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b py-4 last:border-0">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
