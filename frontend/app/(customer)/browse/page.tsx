'use client';

import { Suspense } from 'react';
import { BrowsePage, BrowseFallback } from '@/components/browse/browse-page';

export default function Page() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowsePage />
    </Suspense>
  );
}
