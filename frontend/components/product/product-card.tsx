'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, MapPin, ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDistance } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    mrp?: number;
    images?: string[];
    shop?: {
      name: string;
      slug: string;
      distance?: number;
    };
    rating?: number;
    reviewCount?: number;
    isSponsored?: boolean;
    stock: number;
  };
  viewMode?: 'grid' | 'list';
  className?: string;
}

export function ProductCard({ product, viewMode = 'grid', className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCartStore();

  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.id, 1);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'group relative flex gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-soft',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <Link href={`/product/${product.slug}`} className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ShoppingBag className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
          )}
          {product.isSponsored && (
            <Badge className="absolute left-2 top-2 bg-accent text-white">Sponsored</Badge>
          )}
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <div className="flex justify-between">
            <div>
              <Link href={`/product/${product.slug}`} className="font-medium hover:text-primary">
                {product.name}
              </Link>
              {product.shop && (
                <Link
                  href={`/shop/${product.shop.slug}`}
                  className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <MapPin className="h-3 w-3" />
                  {product.shop.name}
                  {product.shop.distance && <span>• {formatDistance(product.shop.distance)}</span>}
                </Link>
              )}
            </div>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="text-muted-foreground hover:text-red-500"
            >
              <Heart className={cn('h-5 w-5', isWishlisted && 'fill-red-500 text-red-500')} />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.mrp)}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="success" className="text-xs">
                  {discount}% OFF
                </Badge>
              )}
            </div>
            <Button size="sm" onClick={handleAddToCart} disabled={product.stock === 0}>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <ShoppingBag className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground" />
          )}
          
          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isSponsored && (
              <Badge className="bg-accent text-white">Sponsored</Badge>
            )}
            {discount > 0 && (
              <Badge variant="success">{discount}% OFF</Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 backdrop-blur-sm transition-all hover:bg-white"
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-red-500 text-red-500')} />
          </button>

          {/* Quick Add to Cart - Hover */}
          {product.stock > 0 && (
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-all duration-300',
                isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              )}
            >
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart(e);
                }}
              >
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
            {product.name}
          </h3>
          
          {product.shop && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{product.shop.name}</span>
            </p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-lg font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.mrp)}
                </span>
              )}
            </div>
            {product.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{product.rating}</span>
              </div>
            )}
          </div>

          {product.stock === 0 && (
            <p className="mt-2 text-xs font-medium text-destructive">Out of Stock</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
