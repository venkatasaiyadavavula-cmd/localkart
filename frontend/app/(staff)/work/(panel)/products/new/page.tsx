'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { staffWorkApi } from '@/lib/api/staff-work';
import { useStaffRouteGuard } from '@/hooks/use-staff-route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ProductImagesUploadSection,
} from '@/components/forms/product-media-upload';
import { uploadMediaFiles } from '@/lib/utils/media';
import {
  ProductVariantsEditor,
  type ProductVariantInput,
} from '@/components/seller/product-variants-editor';

const CATEGORIES = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home_essentials', label: 'Home Essentials' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'accessories', label: 'Accessories' },
];

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  stock: z.coerce.number().int().min(0, 'Stock must be positive'),
  categoryType: z.string().min(1, 'Category is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function WorkNewProductPage() {
  const router = useRouter();
  useStaffRouteGuard('products:write');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { categoryType: 'groceries', stock: 0 },
  });

  const watchedPrice = watch('price') ?? undefined;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImageUrls((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error('At least one product image is required');
      return;
    }
    setSubmitting(true);
    try {
      const uploadedImages = await uploadMediaFiles(images);
      await staffWorkApi.createProduct({
        ...data,
        images: uploadedImages,
        ...(variantsEnabled && variants.length > 0 ? { variants } : {}),
      });
      toast.success('Product submitted for review');
      router.push('/work/products');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Add Product</h1>
        <p className="text-xs text-gray-500">Product goes for admin approval before going live</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 rounded-2xl border bg-white p-5">
          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register('description')} rows={3} className="resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price (₹) *</Label>
              <Input type="number" min={0} step="0.01" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input type="number" min={0} {...register('stock')} />
              {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register('categoryType')}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.categoryType && <p className="text-xs text-red-500">{errors.categoryType.message}</p>}
          </div>
        </div>

        <ProductVariantsEditor
          enabled={variantsEnabled}
          onEnabledChange={setVariantsEnabled}
          variants={variants}
          onChange={setVariants}
          basePrice={watchedPrice}
        />

        <ProductImagesUploadSection
          variant="card"
          layout="grid"
          newPreviewUrls={imageUrls}
          onUpload={handleImageUpload}
          onRemoveNew={removeImage}
          required
        />

        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Product
        </Button>
      </form>
    </div>
  );
}
