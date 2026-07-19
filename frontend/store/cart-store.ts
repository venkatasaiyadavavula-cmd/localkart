import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils';

interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface CartItem {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  maxQuantity: number;
  slug?: string;
  categoryType?: string;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

/** Bumps when cart is cleared so in-flight sync cannot repopulate stale items. */
let cartSyncGeneration = 0;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      isLoading: false,

      addItem: async (productId: string, quantity = 1) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/cart/items', { productId, quantity });
          const cart = unwrapApiData<CartResponse>(response.data);
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
          toast.success('Item added to cart');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Failed to add item';
          toast.error(message);
          throw error;
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.put(`/cart/items/${productId}`, { quantity });
          const cart = unwrapApiData<CartResponse>(response.data);
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to update quantity');
          throw error;
        }
      },

      removeItem: async (productId: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.delete(`/cart/items/${productId}`);
          const cart = unwrapApiData<CartResponse>(response.data);
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
          toast.success('Item removed from cart');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to remove item');
          throw error;
        }
      },

      clearCart: async () => {
        cartSyncGeneration += 1;
        set({ items: [], totalItems: 0, totalAmount: 0, isLoading: true });
        try {
          await apiClient.delete('/cart');
        } catch {
          // ignore if not logged in or cart already empty
        } finally {
          set({ isLoading: false });
        }
      },

      syncWithServer: async () => {
        const generation = ++cartSyncGeneration;
        set({ isLoading: true });
        try {
          const response = await apiClient.get('/cart');
          if (generation !== cartSyncGeneration) return;
          const cart = unwrapApiData<CartResponse>(response.data);
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
        } catch {
          if (generation === cartSyncGeneration) {
            set({ isLoading: false });
            toast.error('Your cart may be out of date', {
              description: "We couldn't sync with the server. Your saved items might not match what's in stock.",
              action: {
                label: 'Retry',
                onClick: () => {
                  void get().syncWithServer();
                },
              },
            });
          }
        }
      },
    }),
    {
      name: 'localkart-cart',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalAmount: state.totalAmount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.items?.length) {
          state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
          state.totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        }
      },
    }
  )
);
