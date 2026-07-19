import type { Metadata } from 'next';

import { API_URL } from '@/lib/api-config';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await fetch(`${API_URL}/seller/shop/slug/${params.slug}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return {
        title: 'Shop',
        description: 'Discover local shops on LocalKart — Kadapa hyperlocal marketplace.',
      };
    }

    const json = await response.json();
    const shop = json?.data ?? json;
    const title = shop?.name || 'Shop';
    const description =
      shop?.description?.slice(0, 160) ||
      `Shop at ${title} on LocalKart. Order local products with Cash on Delivery in Kadapa.`;
    const image = shop?.bannerImage || shop?.logoImage;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | LocalKart`,
        description,
        type: 'website',
        images: image ? [{ url: image, alt: title }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      title: 'Shop',
      description: 'Discover local shops on LocalKart.',
    };
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
