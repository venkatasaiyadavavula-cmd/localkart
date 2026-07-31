'use client';

import { Button } from '@/components/ui/button';

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function ProductPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: ProductPaginationProps) {
  const effectiveLimit = limit > 0 ? limit : 20;
  const effectiveTotalPages =
    totalPages > 1 ? totalPages : Math.max(1, Math.ceil(total / effectiveLimit));

  if (total <= effectiveLimit && effectiveTotalPages <= 1) {
    return null;
  }

  const start = (page - 1) * effectiveLimit + 1;
  const end = Math.min(page * effectiveLimit, total);

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-gray-500">
          Page {page} of {effectiveTotalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page >= effectiveTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
