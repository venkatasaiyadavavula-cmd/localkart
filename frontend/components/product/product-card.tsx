'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star, Heart, Plus } from 'lucide-react';
import { formatPrice, getProductUrl } from '@/lib/utils';
import { useState } from 'react';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { ShopOpenBadge } from '@/components/shop/shop-open-badge';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    mrp?: number;
    images?: string[];
    slug: string;
    categoryType?: string;
    rating?: number;
    reviewCount?: number;
    orderCount?: number;
    stock?: number;
    shop?: {
      name: string;
      slug?: string;
      isCurrentlyOpen?: boolean;
    };
    shopId?: string;
    shopName?: string;
  };
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCartStore();

  const mrp = product.mrp || product.originalPrice;
  const discount = mrp && mrp > product.price
    ? Math.round(((mrp - product.price) / mrp) * 100)
    : 0;

  const href = getProductUrl(product);

  const shopName = product.shop?.name || product.shopName;
  const shopClosed = product.shop?.isCurrentlyOpen === false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shopClosed) {
      toast.error('Shop is currently closed');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product.id, 1);
    } catch {
      // addItem already shows toast on error
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Please login to use wishlist');
      return;
    }
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/wishlist/toggle`,
        { productId: product.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const added = data?.data?.added ?? data?.added;
      setWishlisted(!!added);
      toast.success(added ? 'Added to wishlist!' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <div className={cn('bg-white flex flex-col relative group', className)}>
      <Link href={href} className="flex flex-col flex-1">
        {/* Image container */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {discount}% off
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={cn('h-3.5 w-3.5 transition-colors', wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
          </button>

          {/* Add to cart overlay — desktop */}
          {shopClosed ? (
            <div className="absolute bottom-0 left-0 right-0 bg-gray-600 text-white text-xs font-semibold py-2 hidden lg:flex items-center justify-center">
              Shop closed
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs font-semibold py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200 hidden lg:flex items-center justify-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* Product info */}
        <div className="p-2 flex flex-col flex-1">
          {shopName && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[10px] text-gray-400 truncate">{shopName}</p>
              {product.shop?.isCurrentlyOpen !== undefined && (
                <ShopOpenBadge isOpen={product.shop.isCurrentlyOpen} />
              )}
            </div>
          )}

          <p className="text-xs text-gray-800 line-clamp-2 leading-tight mb-1.5 font-medium flex-1">
            {product.name}
          </p>

          {/* Rating */}
          {(product.rating || product.orderCount) && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
                <Star className="h-2.5 w-2.5 text-green-600 fill-green-600" />
                <span className="text-[10px] font-semibold text-green-700">{product.rating || '4.2'}</span>
              </div>
              {product.orderCount && product.orderCount > 0 && (
                <span className="text-[10px] text-gray-400">{product.orderCount}+ sold</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <p className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</p>
            {mrp && mrp > product.price && (
              <p className="text-[10px] text-gray-400 line-through">{formatPrice(mrp)}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart button — mobile */}
      {shopClosed ? (
        <p className="lg:hidden mx-2 mb-2 text-center text-xs text-gray-500 py-1.5">
          Shop is currently closed
        </p>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="lg:hidden mx-2 mb-2 bg-primary/10 text-primary text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 active:bg-primary/20"
        >
          <Plus className="h-3 w-3" />
          {addingToCart ? 'Adding...' : 'Add'}
        </button>
      )}
    </div>
  );
}
