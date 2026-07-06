'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart-store';
import { BuyNowWelcomeDialog } from '@/components/orders/buy-now-welcome-dialog';

export function useBuyNowWithWelcome() {
  const router = useRouter();
  const { addItem, clearCart, isLoading: cartLoading } = useCartStore();
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingBuy, setPendingBuy] = useState<{ productId: string; quantity: number } | null>(null);
  const [isProceeding, setIsProceeding] = useState(false);

  const startBuyNow = useCallback((productId: string, quantity: number) => {
    setPendingBuy({ productId, quantity });
    setShowWelcome(true);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!pendingBuy) return;

    setIsProceeding(true);
    try {
      await clearCart();
      await addItem(pendingBuy.productId, pendingBuy.quantity);
      setShowWelcome(false);
      setPendingBuy(null);
      router.push('/checkout');
    } catch {
      toast.error('Failed to proceed to checkout');
    } finally {
      setIsProceeding(false);
    }
  }, [addItem, clearCart, pendingBuy, router]);

  const dialog = (
    <BuyNowWelcomeDialog
      open={showWelcome}
      onOpenChange={(open) => {
        setShowWelcome(open);
        if (!open) setPendingBuy(null);
      }}
      onContinue={handleContinue}
      isLoading={isProceeding || cartLoading}
    />
  );

  return {
    startBuyNow,
    buyNowWelcomeDialog: dialog,
    isBuyNowLoading: isProceeding || cartLoading,
  };
}
