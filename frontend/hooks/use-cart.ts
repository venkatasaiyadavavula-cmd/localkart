import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      isLoading: false,

      addItem: async (productId: string, quantity = 1) => {
        // Implement actual API call
        set({ isLoading: true });
        try {
          // Mock implementation
          set((state) => {
            const newItems = [...state.items];
            const existingIndex = newItems.findIndex(item => item.productId === productId);
            if (existingIndex >= 0) {
              newItems[existingIndex].quantity += quantity;
            } else {
              newItems.push({
                productId,
                shopId: 'mock-shop',
                shopName: 'Mock Shop',
                name: 'Product',
                price: 100,
                quantity,
                image: null,
                maxQuantity: 10,
              });
            }
            const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return { items: newItems, totalItems, totalAmount, isLoading: false };
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        set({ isLoading: true });
        set((state) => {
          const newItems = state.items.map(item =>
            item.productId === productId ? { ...item, quantity } : item
          );
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return { items: newItems, totalItems, totalAmount, isLoading: false };
        });
      },

      removeItem: async (productId: string) => {
        set({ isLoading: true });
        set((state) => {
          const newItems = state.items.filter(item => item.productId !== productId);
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return { items: newItems, totalItems, totalAmount, isLoading: false };
        });
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalAmount: 0 });
      },
    }),
    {
      name: 'localkart-cart',
    }
  )
);
