'use client';

import { ProductCard } from './product-card';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: any[];
  viewMode?: 'grid' | 'list';
  className?: string;
  isFetching?: boolean;
}

export function ProductGrid({
  products,
  viewMode = 'grid',
  className,
  isFetching,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No products found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        isFetching && 'opacity-60',
        viewMode === 'grid'
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5'
          : 'flex flex-col gap-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} viewMode={viewMode} />
      ))}
    </div>
  );
}

// Missing import
import { ShoppingBag } from 'lucide-react';
