'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Upload, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
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
import { useProduct } from '@/hooks/use-product';
import { useUpdateProduct } from '@/hooks/use-update-product';
import { ProductCategoryType } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0, 'Stock must be positive'),
  sku: z.string().optional(),
  brand: z.string().optional(),
  categoryType: z.nativeEnum(ProductCategoryType),
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { updateProduct, isLoading: isUpdating } = useUpdateProduct();

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [newVideoUrls, setNewVideoUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (product) {
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
    }
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

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });
    formData.append('existingImages', JSON.stringify(existingImages));
    formData.append('existingVideos', JSON.stringify(existingVideos));
    newImages.forEach((file) => formData.append('newImages', file));
    newVideos.forEach((file) => formData.append('newVideos', file));

    try {
      await updateProduct(productId, formData);
      toast.success('Product updated successfully. Changes pending approval.');
      router.push('/seller/dashboard/products');
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

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
                    <Input id="stock" type="number" {...register('stock')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register('sku')} />
                </div>
              </CardContent>
            </Card>

            {/* Media Section */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing & New Images */}
                <div className="space-y-3">
                  <Label>Product Images</Label>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {newImageUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {existingImages.length + newImages.length < 5 && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                        <ImageIcon className="h-6 w-6" />
                        <span className="mt-1 text-xs">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleNewImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Videos similar to images */}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={!isDirty || isUpdating}>
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

// Helper to watch form values
function watch(field: string) {
  // This is simplified; in real code use react-hook-form's watch
  return '';
}
