'use client';

import { useParams } from 'next/navigation';
import BrowsePage from '../page';

export default function CategoryPage() {
  const params = useParams();
  const category = (params.category as string).replace(/-/g, '_');

  return <BrowsePage initialCategory={category} />;
}
