import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 10, // Cache is kept for 10 minutes (formerly cacheTime)
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
      refetchOnMount: true, // Refetch when component mounts if data is stale
      refetchOnReconnect: true, // Refetch when internet reconnects
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
};

export const queryClient = new QueryClient(queryClientConfig);

// Query key factory for type-safe query keys
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
  },
  shops: {
    all: ['shops'] as const,
    details: () => [...queryKeys.shops.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.shops.details(), slug] as const,
    nearby: (lat: number, lng: number, radius: number) =>
      ['nearby-shops', { lat, lng, radius }] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.orders.lists(), { status }] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  seller: {
    dashboard: ['seller', 'dashboard'] as const,
    products: ['seller', 'products'] as const,
    orders: ['seller', 'orders'] as const,
    subscription: ['seller', 'subscription'] as const,
    earnings: ['seller', 'earnings'] as const,
    ads: ['seller', 'ads'] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    shops: ['admin', 'shops'] as const,
    products: ['admin', 'products'] as const,
    disputes: ['admin', 'disputes'] as const,
    commissions: ['admin', 'commissions'] as const,
  },
};
