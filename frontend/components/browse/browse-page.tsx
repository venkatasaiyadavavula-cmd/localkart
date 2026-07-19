'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SlidersHorizontal, X, ChevronDown, Zap } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { useProducts } from '@/hooks/use-products';
import { useLocationStore } from '@/store/location-store';
import { normalizeList } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import type { ProductWithOffer } from '@/types/api';
import { API_URL } from '@/lib/api-config';

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

export function BrowseFallback() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}

export function BrowsePage({ initialCategory = '' }: { initialCategory?: string }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const isSaleView = searchParams.get('sale') === 'true';
  const { location } = useLocationStore();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showSort, setShowSort] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const { data, isLoading, isError, refetch } = useProducts({
    categoryType: isSaleView ? undefined : activeCategory,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    latitude: location?.latitude,
    longitude: location?.longitude,
    query: initialQuery,
  });

  const { data: offerProducts, isLoading: offersLoading, isError: offersError, refetch: refetchOffers } = useQuery<ProductWithOffer[]>({
    queryKey: ['browse-today-offers', location?.latitude, location?.longitude],
    queryFn: async () => {
      const { data: res } = await axios.get(`${API_URL}/catalog/today-offers`, {
        params: {
          lat: location?.latitude,
          lng: location?.longitude,
        },
      });
      return normalizeList<ProductWithOffer>(res);
    },
    enabled: isSaleView,
  });

  const rawProducts = isSaleView
    ? (offerProducts ?? [])
    : (Array.isArray(data)
      ? data
      : data?.data ?? data?.products ?? []);

  const products = isSaleView
    ? rawProducts.map((p) => ({
        ...p,
        price: p.daily_offer?.offerPrice ?? p.price,
        mrp: p.daily_offer?.originalPrice ?? p.mrp,
      }))
    : rawProducts;

  const loading = isSaleView ? offersLoading : isLoading;
  const fetchError = isSaleView ? offersError : isError;
  const retryFetch = isSaleView ? refetchOffers : refetch;

  const handleSort = (val: string) => {
    const [by, order] = val.split('-');
    setSortBy(by);
    setSortOrder(order as 'ASC' | 'DESC');
    setShowSort(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isSaleView && (
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
        </div>
      )}

      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {isSaleView ? "Today's Deals" : initialQuery ? `Results for "${initialQuery}"` : 'Browse Products'}
          </h1>
          <p className="text-xs text-gray-500">{products.length} products found</p>
        </div>
        {!isSaleView && (
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Sort <ChevronDown className="h-3 w-3" />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSort(opt.value)}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isSaleView && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
          <Zap className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-bold text-orange-800">Today&apos;s Daily Offers — 24h only</p>
        </div>
      )}

      {initialQuery && !isSaleView && (
        <div className="px-4 py-2 bg-primary/5 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Results for: <span className="font-semibold text-primary">&quot;{initialQuery}&quot;</span>
          </p>
          <button onClick={() => { window.location.href = '/browse'; }}>
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:grid-cols-4 px-4 pb-24">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white">
                <Skeleton className="aspect-square w-full" />
                <div className="p-2 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
        ) : fetchError ? (
          <div className="col-span-full">
            <ErrorState onRetry={() => retryFetch()} />
          </div>
        ) : (
          products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
        )}
      </div>

      {!loading && !fetchError && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs mt-1">Try a different category or search</p>
          {!isSaleView && (
            <button
              onClick={() => { setActiveCategory(''); window.history.replaceState(null, '', '/browse'); }}
              className="mt-3 text-primary text-sm font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
