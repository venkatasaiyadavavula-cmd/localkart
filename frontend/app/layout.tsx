import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthGuard } from '@/components/auth/auth-guard';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'LocalKart - Shop Local',
  description: 'Your local shopping destination',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
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
