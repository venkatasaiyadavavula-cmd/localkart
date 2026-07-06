'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, unwrapApiData, getProductUrl } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import type { WishlistItem } from '@/types/api';
import type { Product } from '@/types/product';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/wishlist`, { headers: auth() });
      return unwrapApiData<WishlistItem[]>(data) ?? [];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await axios.post(`${API}/wishlist/toggle`, { productId }, { headers: auth() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
          <h1 className="text-xl font-bold text-gray-900">My Wishlist</h1>
          {items.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-lg font-bold text-gray-600">Wishlist empty</p>
            <p className="text-sm text-gray-400 mt-1">Save products you love!</p>
            <Link href="/browse" className="mt-4">
              <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl">
                Browse Products <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const product = item.product;
              const discount = product.mrp && product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;

              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <Link href={getProductUrl(product)}>
                    <div className="relative aspect-square bg-gray-100">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {discount}% off
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5">{product.name}</p>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
                        {product.mrp != null && product.mrp > product.price && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="px-3 pb-3">
                    <button
                      onClick={() => removeMutation.mutate(product.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
