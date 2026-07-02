'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SlidersHorizontal, X, ChevronDown, Zap } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { useProducts } from '@/hooks/use-products';
import { useLocationStore } from '@/store/location-store';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeList } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const categories = [
  { label: 'All', value: '' },
  { label: '🛒 Groceries', value: 'groceries' },
  { label: '👗 Fashion', value: 'fashion' },
  { label: '📱 Electronics', value: 'electronics' },
  { label: '🏠 Home', value: 'home_essentials' },
  { label: '💄 Beauty', value: 'beauty' },
  { label: '⌚ Accessories', value: 'accessories' },
];

const sortOptions = [
  { label: 'Newest', value: 'createdAt-DESC' },
  { label: 'Price: Low to High', value: 'price-ASC' },
  { label: 'Price: High to Low', value: 'price-DESC' },
  { label: 'Popular', value: 'orderCount-DESC' },
];

export default function BrowsePage({ initialCategory = '' }: { initialCategory?: string }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const saleMode = searchParams.get('sale') === 'true';
  const { location } = useLocationStore();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showSort, setShowSort] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const { data, isLoading } = useProducts({
    categoryType: activeCategory,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    latitude: location?.latitude,
    longitude: location?.longitude,
    query: initialQuery,
  });

  const { data: saleOffers, isLoading: saleLoading } = useQuery({
    queryKey: ['today-offers-browse', location?.latitude, location?.longitude],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (location?.latitude) params.append('lat', String(location.latitude));
      if (location?.longitude) params.append('lng', String(location.longitude));
      const { data: res } = await axios.get(`${API_URL}/catalog/today-offers?${params}`);
      return normalizeList(res);
    },
    enabled: saleMode,
  });

  const products = saleMode
    ? (saleOffers || [])
    : Array.isArray(data)
      ? data
      : (data as { data?: unknown[]; products?: unknown[] })?.data
        ?? (data as { products?: unknown[] })?.products
        ?? [];

  const loading = saleMode ? saleLoading : isLoading;

  const handleSort = (val: string) => {
    const [by, order] = val.split('-');
    setSortBy(by);
    setSortOrder(order as 'ASC' | 'DESC');
    setShowSort(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category pills */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <p className="text-xs text-gray-500">
            {Array.isArray(products) ? products.length : 0} products
          </p>
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Sort
              <ChevronDown className="h-3 w-3" />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-50 min-w-[180px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSort(opt.value)}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {saleMode && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
          <Zap className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-bold text-orange-800">Today&apos;s Daily Offers — 24h only</p>
        </div>
      )}

      {/* Search query banner */}
      {initialQuery && (
        <div className="px-4 py-2 bg-primary/5 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Results for: <span className="font-semibold text-primary">"{initialQuery}"</span>
          </p>
          <button onClick={() => window.location.href = '/browse'}>
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white">
                <Skeleton className="aspect-square w-full" />
                <div className="p-2 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : Array.isArray(products) && products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
        }
      </div>

      {!loading && (!products || products.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs mt-1">Try a different category or search</p>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
