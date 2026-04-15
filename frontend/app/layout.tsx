import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthGuard } from '@/components/auth/auth-guard';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/api/query-client';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LocalKart - Shop from Local Stores Near You',
    template: '%s | LocalKart',
  },
  description:
    'Discover and shop from trusted local stores in your neighborhood. Same-day delivery from shops in Kadapa and across Andhra Pradesh.',
  keywords: ['local shopping', 'Kadapa', 'Andhra Pradesh', 'hyperlocal', 'grocery', 'fashion', 'electronics'],
  authors: [{ name: 'LocalKart' }],
  creator: 'LocalKart',
  publisher: 'LocalKart',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'LocalKart - Shop from Local Stores Near You',
    description: 'Support local businesses. Get same-day delivery from shops in your neighborhood.',
    url: '/',
    siteName: 'LocalKart',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LocalKart - Hyperlocal Ecommerce',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalKart',
    description: 'Shop local, delivered same day.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <QueryClientProvider client={queryClient}>
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Toaster position="top-center" richColors closeButton />
          </Providers>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
