'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { useProducts } from '@/hooks/use-products';
import { useLocationStore } from '@/store/location-store';
import { normalizeList } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

function BrowseContent({ initialCategory = '' }: { initialCategory?: string }) {
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

  const { data, isLoading } = useProducts({
    categoryType: isSaleView ? undefined : activeCategory,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    latitude: location?.latitude,
    longitude: location?.longitude,
    query: initialQuery,
  });

  const { data: offerProducts, isLoading: offersLoading } = useQuery({
    queryKey: ['browse-today-offers', location?.latitude, location?.longitude],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/today-offers`, {
        params: {
          lat: location?.latitude,
          lng: location?.longitude,
        },
      });
      return normalizeList(data);
    },
    enabled: isSaleView,
  });

  const products = isSaleView
    ? (offerProducts ?? [])
    : (Array.isArray(data)
      ? data
      : (data as { data?: unknown[]; products?: unknown[] })?.data
        ?? (data as { products?: unknown[] })?.products
        ?? []);

  const loading = isSaleView ? offersLoading : isLoading;

  const handleSort = (val: string) => {
    const [by, order] = val.split('-');
    setSortBy(by);
    setSortOrder(order as 'ASC' | 'DESC');
    setShowSort(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-none" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No products found</p>
          <button onClick={() => window.location.href = '/browse'} className="mt-3 text-primary text-sm font-semibold">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 px-4 pb-24">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function BrowseFallback() {
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

export default function BrowsePage({ initialCategory = '' }: { initialCategory?: string }) {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowseContent initialCategory={initialCategory} />
    </Suspense>
  );
}
