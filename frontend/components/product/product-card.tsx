'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images?: string[];
    slug: string;
    categoryType?: string;
    rating?: number;
    shop?: { name: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const href = product.categoryType
    ? `/browse/${product.categoryType}/product/${product.slug}`
    : `/browse/product/${product.slug}`;

  return (
    <div className="bg-white flex flex-col relative">
      {/* Wishlist */}
      <button
        onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-sm"
      >
        <Heart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>

      <Link href={href}>
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {discount}% off
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2 pb-3">
          {product.shop?.name && (
            <p className="text-[10px] text-gray-400 mb-0.5 truncate">{product.shop.name}</p>
          )}
          <p className="text-xs text-gray-800 line-clamp-2 leading-tight mb-1 font-medium">{product.name}</p>
          <div className="flex items-center gap-1 mb-1">
            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] text-gray-500">{product.rating || '4.2'}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</p>
            {product.originalPrice && (
              <p className="text-[10px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
