import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Syne } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthGuard } from '@/components/auth/auth-guard';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'LocalKart — Shop Local, Delivered Fast',
    template: '%s | LocalKart',
  },
  description:
    'Discover products from local shops in your city. Same-day delivery, best prices, support your community.',
  keywords: ['local shopping', 'hyperlocal', 'same day delivery', 'Kadapa', 'Andhra Pradesh'],
  authors: [{ name: 'Venkata Sai Yadav', url: 'https://github.com/venkatasaiyadavavula-cmd' }],
  creator: 'Venkata Sai Yadav',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'LocalKart',
    title: 'LocalKart — Shop Local, Delivered Fast',
    description: 'Discover products from local shops in your city.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalKart — Shop Local, Delivered Fast',
    description: 'Discover products from local shops in your city.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'facebook-domain-verification': 'm8a4lnca6bhmqgzohc500c9it952hm',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#080916' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${syne.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
