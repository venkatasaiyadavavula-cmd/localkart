import { z } from 'zod';

export const ProductCategoryType = z.enum([
  'groceries',
  'fashion',
  'electronics',
  'home_essentials',
  'beauty',
  'accessories',
]);

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0, 'Stock must be positive').default(0),
  sku: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  categoryType: ProductCategoryType,
  categoryId: z.string().uuid().optional(),
  attributes: z.record(z.any()).optional(),
});

export const productImageSchema = z.object({
  images: z.array(z.instanceof(File)).min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  videos: z.array(z.instanceof(File)).max(3, 'Maximum 3 videos allowed').optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
