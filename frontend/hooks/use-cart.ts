import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface CartItem {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  maxQuantity: number;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      isLoading: false,

      addItem: async (productId, quantity = 1) => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('accessToken');
          const { data } = await apiClient.post('/cart/items', { productId, quantity }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const cart = data.data;
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
          toast.success('Added to cart');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to add item');
          throw error;
        }
      },

      updateQuantity: async (productId, quantity) => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('accessToken');
          const { data } = await apiClient.put(`/cart/items/${productId}`, { quantity }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const cart = data.data;
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to update cart');
          throw error;
        }
      },

      removeItem: async (productId) => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('accessToken');
          const { data } = await apiClient.delete(`/cart/items/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const cart = data.data;
          set({
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            isLoading: false,
          });
          toast.success('Removed from cart');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to remove item');
          throw error;
        }
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalAmount: 0 });
      },

      syncWithServer: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('accessToken');
          const { data } = await apiClient.get('/cart', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const cart = data.data;
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

export const useCart = () => useCartStore();
