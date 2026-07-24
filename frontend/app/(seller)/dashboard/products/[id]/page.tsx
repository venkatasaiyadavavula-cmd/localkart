'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSellerProduct } from '@/hooks/use-product';
import { useUpdateProduct } from '@/hooks/use-update-product';
import { uploadMediaFiles } from '@/lib/utils/media';
import {
  ProductImagesUploadSection,
  ProductVideosUploadSection,
} from '@/components/forms/product-media-upload';
import { PRODUCT_CATEGORY_VALUES, type ProductCategoryType } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock must be positive'),
  sku: z.string().optional(),
  brand: z.string().optional(),
  categoryType: z.enum(PRODUCT_CATEGORY_VALUES),
});

type ProductFormData = z.infer<typeof productSchema>;

const categoryOptions = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home_essentials', label: 'Home Essentials' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'accessories', label: 'Accessories' },
];

const emptyProductDefaults: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  sku: '',
  brand: '',
  categoryType: 'groceries',
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading: productLoading, isError: productError } = useSellerProduct(productId);
  const { updateProduct, isLoading: isUpdating } = useUpdateProduct();

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [newVideoUrls, setNewVideoUrls] = useState<string[]>([]);
  const [formHydrated, setFormHydrated] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyProductDefaults,
  });

  useEffect(() => {
    if (!product) {
      setFormHydrated(false);
      return;
    }
    reset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      mrp: product.mrp || undefined,
      stock: product.stock,
      sku: product.sku || '',
      brand: product.brand || '',
      categoryType: product.categoryType,
    });
    setExistingImages(product.images || []);
    setExistingVideos(product.videos || []);
    setFormHydrated(true);
  }, [product, reset]);

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setNewImageUrls((prev) => [...prev, ...newUrls]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(newImageUrls[index]);
    setNewImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalVideos = existingVideos.length + newVideos.length + files.length;
    if (totalVideos > 3) {
      toast.error('Maximum 3 videos allowed');
      return;
    }
    setNewVideos((prev) => [...prev, ...files]);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setNewVideoUrls((prev) => [...prev, ...newUrls]);
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index: number) => {
    setNewVideos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(newVideoUrls[index]);
    setNewVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (existingImages.length + newImages.length === 0) {
      toast.error('At least one product image is required');
      return;
    }

    try {
      let uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedImageUrls = await uploadMediaFiles(newImages);
      }

      let uploadedVideoUrls: string[] = [];
      if (newVideos.length > 0) {
        uploadedVideoUrls = await uploadMediaFiles(newVideos);
      }

      const allImages = [...existingImages, ...uploadedImageUrls];
      const allVideos = [...existingVideos, ...uploadedVideoUrls];

      await updateProduct({
        productId,
        data: {
          ...data,
          images: allImages,
          videos: allVideos,
        },
      });
      toast.success('Product updated successfully. Changes pending approval.');
      router.push('/dashboard/products');
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const hasMediaChanges =
    newImages.length > 0 ||
    newVideos.length > 0 ||
    (product && (
      JSON.stringify(existingImages) !== JSON.stringify(product.images || []) ||
      JSON.stringify(existingVideos) !== JSON.stringify(product.videos || [])
    ));

  const canSave = isDirty || hasMediaChanges;

  if (productLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h1 className="text-xl font-bold">Product not found</h1>
        <p className="text-muted-foreground text-sm">This product may have been deleted or you do not have access.</p>
        <Button onClick={() => router.push('/dashboard/products')}>Back to Products</Button>
      </div>
    );
  }

  if (!formHydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Edit Product</h1>
          <p className="text-muted-foreground">Update your product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Same fields as new product form */}
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} rows={4} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categoryType">Category *</Label>
                    <Select
                      value={watch('categoryType')}
                      onValueChange={(value) => setValue('categoryType', value as ProductCategoryType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" {...register('brand')} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price (₹) *</Label>
                    <Input id="price" type="number" step="0.01" {...register('price')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input id="mrp" type="number" step="0.01" {...register('mrp')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input id="stock" type="number" step="1" min="0" {...register('stock')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register('sku')} />
                </div>
              </CardContent>
            </Card>

            <ProductImagesUploadSection
              variant="card"
              existingUrls={existingImages}
              newPreviewUrls={newImageUrls}
              onUpload={handleNewImageUpload}
              onRemoveExisting={removeExistingImage}
              onRemoveNew={removeNewImage}
              required
            />

            <ProductVideosUploadSection
              variant="card"
              existingUrls={existingVideos}
              newPreviewUrls={newVideoUrls}
              onUpload={handleNewVideoUpload}
              onRemoveExisting={removeExistingVideo}
              onRemoveNew={removeNewVideo}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={!canSave || isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
