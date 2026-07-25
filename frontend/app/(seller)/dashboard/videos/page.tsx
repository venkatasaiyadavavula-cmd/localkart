'use client';

import { useRouter } from 'next/navigation';
import { SellerProductVideosPanel } from '@/components/seller/seller-product-videos-panel';

export default function SellerVideosPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload product videos (up to 3 per product). Clips appear on the product page and the
          customer Videos feed.
        </p>
      </div>
      <SellerProductVideosPanel
        onSavedSuccessfully={() => router.push('/dashboard/products')}
      />
    </div>
  );
}
