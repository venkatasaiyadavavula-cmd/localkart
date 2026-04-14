'use client';

import { useParams } from 'next/navigation';
import { BrowsePage } from '../page';

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;

  // The BrowsePage component already handles category via searchParams
  // We can pass it through or redirect
  return <BrowsePage />;
}
