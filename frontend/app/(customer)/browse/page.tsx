'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, X, ChevronDown, Grid2X2, LayoutList } from 'lucide-react';

import { ProductGrid } from '@/components/product/product-grid';
import { ProductFilters } from '@/components/product/product-filters';
import { SortDropdown } from '@/components/product/sort-dropdown';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useProducts } from '@/hooks/use-products';
import { useLocationStore } from '@/store/location-store';
import { Skeleton } from '@/components/ui/skeleton';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const { location } = useLocationStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryType: initialCategory,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: 'createdAt',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
  });

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useProducts({
    ...filters,
    latitude: location?.latitude,
    longitude: location?.longitude,
    query: initialQuery,
  });

  useEffect(() => {
    if (location) {
      refetch();
    }
  }, [location, refetch]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      categoryType: '',
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  };

  const activeFilterCount = [
    filters.categoryType,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="container py-6 md:py-8 lg:py-10">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {initialQuery ? `Search results for "${initialQuery}"` : 'Browse Products'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.meta.total || 0} products found
          {location && ' near you'}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ProductFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  onClear={clearFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Active Filters Chips */}
          <div className="hidden flex-wrap gap-2 lg:flex">
            {filters.categoryType && (
              <FilterChip
                label={`Category: ${filters.categoryType}`}
                onRemove={() => handleFilterChange({ categoryType: '' })}
              />
            )}
            {filters.minPrice && (
              <FilterChip
                label={`Min: ₹${filters.minPrice}`}
                onRemove={() => handleFilterChange({ minPrice: undefined })}
              />
            )}
            {filters.maxPrice && (
              <FilterChip
                label={`Max: ₹${filters.maxPrice}`}
                onRemove={() => handleFilterChange({ maxPrice: undefined })}
              />
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="hidden items-center rounded-lg border p-1 sm:flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <SortDropdown
            value={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
            onChange={(sortBy, sortOrder) => handleFilterChange({ sortBy, sortOrder })}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <ProductFilters
              filters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* Products Area */}
        <div className="flex-1">
          {isLoading ? (
            <ProductGridSkeleton viewMode={viewMode} />
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="mt-1 text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode + JSON.stringify(filters)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProductGrid
                  products={data?.data || []}
                  viewMode={viewMode}
                  isFetching={isFetching}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={(page) => {
                  // Handle page change via query params
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      {label}
      <button onClick={onRemove} className="hover:text-primary/80">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ProductGridSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4' : 'space-y-4'}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={viewMode === 'list' ? 'flex gap-4' : ''}>
          <Skeleton className={viewMode === 'grid' ? 'aspect-square w-full rounded-xl' : 'h-24 w-24 rounded-xl'} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: any) {
  // Simplified pagination - implement full version in components
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        Previous
      </Button>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        Next
      </Button>
    </div>
  );
}
