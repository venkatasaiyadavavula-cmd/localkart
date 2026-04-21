'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    maxQuantity: number;
  };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  isLoading?: boolean;
  showShopName?: boolean;
  shopName?: string;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isLoading,
  showShopName,
  shopName,
}: CartItemProps) {
  return (
    <div className="flex gap-4 py-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        ) : (
          <ShoppingBag className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/product/${item.productId}`}
              className="font-medium hover:text-primary"
            >
              {item.name}
            </Link>
            {showShopName && shopName && (
              <p className="text-xs text-muted-foreground">{shopName}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm font-semibold text-primary">{formatPrice(item.price)}</p>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={isLoading}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={isLoading || item.quantity >= item.maxQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}
