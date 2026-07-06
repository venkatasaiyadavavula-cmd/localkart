'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { BrowsePage, BrowseFallback } from '@/components/browse/browse-page';

function CategoryBrowse() {
  const params = useParams();
  const category = (params.category as string).replace(/-/g, '_');
  return <BrowsePage initialCategory={category} />;
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <CategoryBrowse />
    </Suspense>
  );
}
