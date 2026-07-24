'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateProduct } from '@/hooks/use-create-product';
import { AiDescriptionGenerator } from '@/components/seller/ai-description-generator';
import {
  MAX_VIDEOS_DEFAULT,
  ProductImagesUploadSection,
  ProductVideosUploadSection,
} from '@/components/forms/product-media-upload';
import { uploadMediaFiles } from '@/lib/utils/media';

enum ProductCategoryType {
  GROCERIES       = 'groceries',
  FASHION         = 'fashion',
  ELECTRONICS     = 'electronics',
  HOME_ESSENTIALS = 'home_essentials',
  BEAUTY          = 'beauty',
  ACCESSORIES     = 'accessories',
}

const productSchema = z.object({
  name:         z.string().min(1, 'Product name is required').max(200),
  description:  z.string().optional(),
  price:        z.coerce.number().min(0, 'Price must be positive'),
  mrp:          z.coerce.number().min(0).optional(),
  stock:        z.coerce.number().int('Stock must be a whole number').min(0, 'Stock must be positive'),
  sku:          z.string().optional(),
  brand:        z.string().optional(),
  categoryType: z.nativeEnum(ProductCategoryType),
  categoryId:   z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const categoryOptions = [
  { value: 'groceries',       label: '🛒 Groceries' },
  { value: 'fashion',         label: '👗 Fashion' },
  { value: 'electronics',     label: '📱 Electronics' },
  { value: 'home_essentials', label: '🏠 Home Essentials' },
  { value: 'beauty',          label: '💄 Beauty' },
  { value: 'accessories',     label: '⌚ Accessories' },
];

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isLoading } = useCreateProduct();

  const [images,    setImages]    = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videos,    setVideos]    = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock: 0 },
  });

  const watchedName  = watch('name')  ?? '';
  const watchedPrice = watch('price') ?? undefined;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setImageUrls(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (videos.length + files.length > MAX_VIDEOS_DEFAULT) {
      toast.error(`Maximum ${MAX_VIDEOS_DEFAULT} videos allowed`);
      return;
    }
    setVideos((prev) => [...prev, ...files]);
    files.forEach((f) => setVideoUrls((prev) => [...prev, URL.createObjectURL(f)]));
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoUrls[index]);
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!data.categoryType) {
      toast.error('Please select a category');
      return;
    }
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadMediaFiles(images);
      }

      let videoUrls: string[] = [];
      if (videos.length > 0) {
        videoUrls = await uploadMediaFiles(videos);
      }

      await createProduct({
        ...data,
        images: imageUrls,
        videos: videoUrls,
      });
      toast.success('Product created successfully. Awaiting approval.');
      router.push('/dashboard/products');
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.includes('storage')
          ? 'Video upload failed while saving to storage. Please try again.'
          : 'Failed to create product';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Add New Product
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Fill in details — use ✨ AI to write description</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Basic Details */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold text-gray-700">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-gray-600">Product Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Toor Dal 1kg" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Description + AI button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-bold text-gray-600">
                  Description
                </Label>
                <AiDescriptionGenerator
                  productName={watchedName}
                  category={selectedCategory}
                  price={watchedPrice}
                  onGenerated={(desc) => setValue('description', desc)}
                />
              </div>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your product... or click ✨ AI Generate →"
                rows={4}
                className="resize-none text-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600">Category *</Label>
              <Select onValueChange={(v) => {
                setValue('categoryType', v as ProductCategoryType);
                setSelectedCategory(v);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryType && <p className="text-xs text-red-500">{errors.categoryType.message}</p>}
            </div>

          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold text-gray-700">Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-bold text-gray-600">Selling Price (₹) *</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} placeholder="0.00" />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mrp" className="text-xs font-bold text-gray-600">MRP (₹)</Label>
              <Input id="mrp" type="number" step="0.01" {...register('mrp')} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-xs font-bold text-gray-600">Stock Quantity *</Label>
              <Input id="stock" type="number" step="1" min="0" {...register('stock')} placeholder="0" />
              {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-xs font-bold text-gray-600">SKU / Barcode</Label>
              <Input id="sku" {...register('sku')} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        <ProductImagesUploadSection
          variant="card"
          layout="grid"
          newPreviewUrls={imageUrls}
          onUpload={handleImageUpload}
          onRemoveNew={removeImage}
          required
        />

        <ProductVideosUploadSection
          variant="card"
          layout="grid"
          newPreviewUrls={videoUrls}
          onUpload={handleVideoUpload}
          onRemoveNew={removeVideo}
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-sm font-extrabold rounded-2xl"
          style={{
            background:  'linear-gradient(135deg,#3D5AF1,#6D28D9)',
            boxShadow:   '0 4px 20px rgba(61,90,241,0.30)',
          }}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? 'Creating...' : 'Create Product'}
        </Button>

      </form>
    </div>
  );
}
