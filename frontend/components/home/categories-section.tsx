'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { ShoppingBag, Shirt, Smartphone, Home, Sparkles, Watch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const categoryConfig: Record<string, { emoji: string }> = {
  groceries:       { emoji: '🛒' },
  fashion:         { emoji: '👗' },
  electronics:     { emoji: '📱' },
  home_essentials: { emoji: '🏠' },
  beauty:          { emoji: '💄' },
  accessories:     { emoji: '⌚' },
};

export function CategoriesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/categories`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-4 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-16 flex-shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2">
      {(data || []).slice(0, 8).map((category: any) => {
        const config = categoryConfig[category.slug] || { emoji: '🛍️' };
        return (
          <Link key={category.id} href={`/browse/${category.slug}`} className="flex-shrink-0">
            <div className="flex flex-col items-center gap-1.5 w-16">
              <div className="bg-gray-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                {config.emoji}
              </div>
              <span className="text-xs text-center text-gray-700 font-medium leading-tight line-clamp-2">
                {category.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
