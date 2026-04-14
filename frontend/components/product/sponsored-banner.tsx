'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { useSponsoredProducts } from '@/hooks/use-sponsored-products';
import { Skeleton } from '@/components/ui/skeleton';

export function SponsoredBanner() {
  const { data: products, isLoading } = useSponsoredProducts();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!products?.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  const handlePrevious = () => {
    if (!products?.length) return;
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNext = () => {
    if (!products?.length) return;
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (!products?.length) {
    return null;
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="absolute left-2 top-2 z-10">
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Sponsored
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row"
        >
          <div className="relative aspect-square w-full sm:w-48">
            {currentProduct.images?.[0] && (
              <Image
                src={currentProduct.images[0]}
                alt={currentProduct.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
            <div>
              <h3 className="font-heading text-xl font-bold sm:text-2xl">
                {currentProduct.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {currentProduct.description}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(currentProduct.price)}
                </span>
                {currentProduct.mrp > currentProduct.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(currentProduct.mrp)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Button asChild>
                <Link href={`/product/${currentProduct.slug}`}>
                  Shop Now
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {products.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Indicators */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
