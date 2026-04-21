import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, formData }: { productId: string; formData: FormData }) => {
      const token = localStorage.getItem('accessToken');
      const { data } = await apiClient.put(`/seller/products/${productId}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
    },
  });
}
