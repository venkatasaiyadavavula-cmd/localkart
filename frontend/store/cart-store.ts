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
          toast.error(error.response?.data?.message || 'Failed to add item');
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
        try {
          await apiClient.delete('/cart');
        } catch {
          // ignore if not logged in or cart already empty
        }
        set({ items: [], totalItems: 0, totalAmount: 0 });
      },

      syncWithServer: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get('/cart');
          const cart = unwrapApiData<CartResponse>(response.data);
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'localkart-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
