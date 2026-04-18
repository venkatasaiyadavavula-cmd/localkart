'use client';

import { useParams } from 'next/navigation';
import BrowsePage from '../page';

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;

  // Just render the main BrowsePage which handles category via searchParams
  return <BrowsePage />;
}
