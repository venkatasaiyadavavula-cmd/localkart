'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { ShoppingBag, Shirt, Smartphone, Home, Sparkles, Watch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const categoryIcons: Record<string, any> = {
  groceries: ShoppingBag,
  fashion: Shirt,
  electronics: Smartphone,
  home_essentials: Home,
  beauty: Sparkles,
  accessories: Watch,
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
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-center">Shop by Category</h2>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-center">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {data?.slice(0, 6).map((category: any) => {
          const Icon = categoryIcons[category.slug] || ShoppingBag;
          return (
            <Link key={category.id} href={`/browse/${category.slug}`}>
              <Card className="flex flex-col items-center justify-center p-4 hover:shadow-soft transition-shadow h-full">
                <div className="rounded-full bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="mt-2 text-sm font-medium">{category.name}</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
