import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      productId,
      formData,
      data,
    }: {
      productId: string;
      formData?: FormData;
      data?: Record<string, unknown>;
    }) => {
      let payload: Record<string, unknown> = data ?? {};

      if (formData) {
        formData.forEach((value, key) => {
          if (key.startsWith('existing') || key.startsWith('new')) return;
          const str = String(value);
          if (['price', 'mrp', 'stock'].includes(key)) {
            payload[key] = Number(str);
          } else {
            payload[key] = str;
          }
        });
      }

      const { data: response } = await apiClient.put(`/catalog/seller/products/${productId}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-product', variables.productId] });
    },
  });

  return {
    updateProduct: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
