'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Package } from 'lucide-react';

interface TopProductsProps {
  products: any[];
}

export function TopProducts({ products }: TopProductsProps) {
  if (!products?.length) {
    return <p className="text-center text-muted-foreground py-4">No products yet</p>;
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/seller/dashboard/products/${product.id}`}
          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
            {product.images?.[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
            ) : (
              <Package className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium line-clamp-1">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.orderCount} sold</p>
          </div>
          <p className="font-medium">{formatPrice(product.price)}</p>
        </Link>
      ))}
    </div>
  );
}
