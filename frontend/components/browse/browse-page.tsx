'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SlidersHorizontal, X, ChevronDown, Zap, IndianRupee } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductPagination } from '@/components/product/product-pagination';
import { useProducts } from '@/hooks/use-products';
import { useLocationStore } from '@/store/location-store';
import { normalizeList } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductWithOffer } from '@/types/api';
import { API_URL } from '@/lib/api-config';

const PAGE_LIMIT = 20;

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
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const { data: productResult, isLoading, isError, refetch } = useProducts({
    categoryType: isSaleView ? undefined : activeCategory || undefined,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    latitude: location?.latitude,
    longitude: location?.longitude,
    query: initialQuery || undefined,
    page,
    limit: PAGE_LIMIT,
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
    : (productResult?.data ?? []);

  const products = isSaleView
    ? (rawProducts as ProductWithOffer[]).map((p) => ({
        ...p,
        price: p.daily_offer?.offerPrice ?? p.price,
        mrp: p.daily_offer?.originalPrice ?? p.mrp,
      }))
    : rawProducts;

  const meta = productResult?.meta;
  const totalCount = isSaleView ? products.length : meta?.total ?? products.length;

  const loading = isSaleView ? offersLoading : isLoading;
  const fetchError = isSaleView ? offersError : isError;
  const retryFetch = isSaleView ? refetchOffers : refetch;

  const handleSort = (val: string) => {
    const [by, order] = val.split('-');
    setSortBy(by);
    setSortOrder(order as 'ASC' | 'DESC');
    setPage(1);
    setShowSort(false);
  };

  const applyPriceFilter = () => {
    setMinPrice(draftMinPrice ? Number(draftMinPrice) : undefined);
    setMaxPrice(draftMaxPrice ? Number(draftMaxPrice) : undefined);
    setPage(1);
    setShowPriceFilter(false);
  };

  const clearPriceFilter = () => {
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPage(1);
    setShowPriceFilter(false);
  };

  const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {!isSaleView && (
        <div className="bg-white border-b sticky top-0 z-30">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setActiveCategory(cat.value);
                  setPage(1);
                }}
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
          <p className="text-xs text-gray-500">{totalCount} products found</p>
        </div>
        {!isSaleView && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowPriceFilter(!showPriceFilter);
                  setShowSort(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                  hasPriceFilter ? 'border-primary text-primary bg-primary/5' : ''
                }`}
              >
                <IndianRupee className="h-3.5 w-3.5" />
                Price
                {hasPriceFilter && <span className="text-[10px]">•</span>}
              </button>
              {showPriceFilter && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg z-20 p-3 min-w-[200px]">
                  <Label className="text-xs text-gray-600">Price range (₹)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="h-8 w-20 text-xs"
                    />
                    <span className="text-gray-400">–</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="h-8 w-20 text-xs"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={clearPriceFilter}
                      className="flex-1 text-xs py-1.5 rounded-lg border text-gray-600"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyPriceFilter}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-primary text-white font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setShowSort(!showSort);
                  setShowPriceFilter(false);
                }}
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

      <div className="grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:grid-cols-4 px-4 pb-4">
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

      {!isSaleView && !loading && !fetchError && meta && (
        <ProductPagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
        />
      )}

      {!loading && !fetchError && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs mt-1">Try a different category or search</p>
          {!isSaleView && (
            <button
              onClick={() => {
                setActiveCategory('');
                setMinPrice(undefined);
                setMaxPrice(undefined);
                setDraftMinPrice('');
                setDraftMaxPrice('');
                setPage(1);
                window.history.replaceState(null, '', '/browse');
              }}
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
