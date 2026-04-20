// app/layout.tsx లో ఈ లైన్ జోడించండి
export const dynamic = 'force-dynamic';

// మీ మిగతా కోడ్ యథాతథంగా ఉంచండి
import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthGuard } from '@/components/auth/auth-guard';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/api/query-client';

// ... మీ ఫాంట్లు మరియు మెటాడేటా యథాతథంగా ఉంచండి ...

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
