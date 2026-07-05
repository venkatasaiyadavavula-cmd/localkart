import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Props = {
  params: { category: string; slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await fetch(`${API_URL}/catalog/products/${params.slug}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return {
        title: 'Product',
        description: 'Shop local products on LocalKart — Kadapa hyperlocal marketplace.',
      };
    }

    const json = await response.json();
    const product = json?.data ?? json;
    const title = product?.name || 'Product';
    const description =
      product?.description?.slice(0, 160) ||
      `Buy ${title} from local shops in Kadapa on LocalKart. Cash on Delivery available.`;
    const image = product?.images?.[0];

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
      title: 'Product',
      description: 'Shop local products on LocalKart.',
    };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
