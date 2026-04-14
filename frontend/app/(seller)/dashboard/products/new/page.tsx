'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
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
import { useCreateProduct } from '@/hooks/use-create-product';
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
  categoryId: z.string().optional(),
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

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isLoading } = useCreateProduct();
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: 0,
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImageUrls((prev) => [...prev, ...newUrls]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (videos.length + files.length > 3) {
      toast.error('Maximum 3 videos allowed');
      return;
    }
    setVideos((prev) => [...prev, ...files]);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setVideoUrls((prev) => [...prev, ...newUrls]);
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(videoUrls[index]);
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error('At least one product image is required');
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });
    images.forEach((file) => formData.append('images', file));
    videos.forEach((file) => formData.append('videos', file));

    try {
      await createProduct(formData);
      toast.success('Product created successfully. Awaiting approval.');
      router.push('/seller/dashboard/products');
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product listing for your shop</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Basic details about your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" {...register('name')} placeholder="e.g., Organic Basmati Rice" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe your product..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categoryType">Category *</Label>
                    <Select
                      onValueChange={(value) => setValue('categoryType', value as ProductCategoryType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryType && (
                      <p className="text-xs text-destructive">{errors.categoryType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand (Optional)</Label>
                    <Input id="brand" {...register('brand')} placeholder="e.g., Tata" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register('price')}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      {...register('mrp')}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      {...register('stock')}
                      placeholder="0"
                    />
                    {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                  <Input id="sku" {...register('sku')} placeholder="e.g., RICE-BAS-1KG" />
                </div>
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Add images and videos of your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Images */}
                <div className="space-y-3">
                  <Label>Product Images * (Max 5)</Label>
                  <div className="flex flex-wrap gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                        <img src={url} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary">
                        <ImageIcon className="h-6 w-6" />
                        <span className="mt-1 text-xs">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                  {images.length === 0 && (
                    <p className="text-xs text-destructive">At least one image is required</p>
                  )}
                </div>

                {/* Videos */}
                <div className="space-y-3">
                  <Label>Product Videos (Max 3)</Label>
                  <div className="flex flex-wrap gap-3">
                    {videoUrls.map((url, index) => (
                      <div key={index} className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                        <div className="flex h-full w-full items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {videos.length < 3 && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary">
                        <Video className="h-6 w-6" />
                        <span className="mt-1 text-xs">Upload</span>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          className="hidden"
                          onChange={handleVideoUpload}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹10 per video upload charge applies
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
                <CardDescription>Save and submit for approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p>Your product will be reviewed by our team before going live.</p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
