'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronLeft, ChevronRight, Upload, X, Loader2,
  Camera, Video, Package, Tag, BarChart3, CheckCircle,
  Image as ImageIcon, Sparkles, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCreateProduct } from '@/hooks/use-create-product';

enum ProductCategoryType {
  GROCERIES = 'groceries',
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  HOME_ESSENTIALS = 'home_essentials',
  BEAUTY = 'beauty',
  ACCESSORIES = 'accessories',
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  price: z.coerce.number().min(1, 'Price must be at least ₹1'),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0, 'Stock must be 0 or more'),
  sku: z.string().optional(),
  brand: z.string().optional(),
  categoryType: z.nativeEnum(ProductCategoryType),
});

type ProductFormData = z.infer<typeof productSchema>;

const categoryOptions = [
  { value: 'groceries', label: 'Groceries', emoji: '🛒' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'electronics', label: 'Electronics', emoji: '📱' },
  { value: 'home_essentials', label: 'Home Essentials', emoji: '🏠' },
  { value: 'beauty', label: 'Beauty', emoji: '💄' },
  { value: 'accessories', label: 'Accessories', emoji: '⌚' },
];

const STEPS = [
  { id: 1, title: 'Photos & Videos', icon: Camera, desc: 'Add product media' },
  { id: 2, title: 'Basic Details', icon: Package, desc: 'Name & description' },
  { id: 3, title: 'Price & Stock', icon: Tag, desc: 'Set price & quantity' },
  { id: 4, title: 'Preview & Publish', icon: CheckCircle, desc: 'Review & submit' },
];

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isLoading } = useCreateProduct();
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock: 1 },
  });

  const watchedValues = watch();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
    setImageUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (videos.length + files.length > 2) {
      toast.error('Maximum 2 videos allowed');
      return;
    }
    setVideos(prev => [...prev, ...files]);
    setVideoUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoUrls[index]);
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (currentStep === 1 && images.length === 0) {
      toast.error('Please add at least one product photo');
      return;
    }
    if (currentStep === 2) {
      const valid = await trigger(['name', 'categoryType']);
      if (!valid) return;
    }
    if (currentStep === 3) {
      const valid = await trigger(['price', 'stock']);
      if (!valid) return;
    }
    setCurrentStep(prev => Math.min(4, prev + 1));
  };

  const discount = watchedValues.mrp && watchedValues.price && watchedValues.mrp > watchedValues.price
    ? Math.round(((watchedValues.mrp - watchedValues.price) / watchedValues.mrp) * 100)
    : 0;

  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') formData.append(key, String(value));
    });
    images.forEach(file => formData.append('images', file));
    videos.forEach(file => formData.append('videos', file));
    try {
      await createProduct(formData);
      toast.success('🎉 Product submitted for review!');
      router.push('/dashboard/products');
    } catch {
      toast.error('Failed to create product. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => currentStep === 1 ? router.back() : setCurrentStep(p => p - 1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">Add New Product</h1>
            <p className="text-xs text-gray-500">Step {currentStep} of 4 — {STEPS[currentStep - 1].desc}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Description — AI button tho */}
<div>
  <div className="flex items-center justify-between mb-1.5">
    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
      Description
      <span className="text-xs font-normal text-gray-400 ml-2">(Optional but recommended)</span>
    </Label>
    <button
      type="button"
      onClick={generateDescription}
      disabled={!watchedValues.name || isGenerating}
      className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {isGenerating ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
      ) : (
        <><Sparkles className="h-3.5 w-3.5" /> AI తో రాయించు</>
      )}
    </button>
  </div>
  <Textarea
    id="description"
    {...register('description')}
    placeholder="Tell customers about your product..."
    rows={4}
    className="rounded-xl resize-none"
  />
</div>
      
      {/* Step indicators */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              <div className={cn(
                'flex items-center gap-1.5',
                currentStep >= step.id ? 'text-primary' : 'text-gray-300'
              )}>
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  currentStep > step.id ? 'bg-primary text-white' :
                  currentStep === step.id ? 'bg-primary/10 text-primary border border-primary' :
                  'bg-gray-100 text-gray-400'
                )}>
                  {currentStep > step.id ? <CheckCircle className="h-3.5 w-3.5" /> : step.id}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block',
                  currentStep >= step.id ? 'text-gray-700' : 'text-gray-400'
                )}>
                  {step.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-4 sm:w-8 mx-1', currentStep > step.id ? 'bg-primary' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* ── STEP 1: Photos & Videos ── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Product Photos</h2>
                  <span className="text-xs text-gray-400 ml-auto">{images.length}/5 photos</span>
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className={cn(
                      'relative rounded-xl overflow-hidden bg-gray-100',
                      i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                    )}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className={cn(
                      'aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all',
                      images.length === 0 && 'col-span-3 py-10'
                    )}>
                      <Camera className={cn('text-gray-300', images.length === 0 ? 'h-12 w-12' : 'h-6 w-6')} />
                      {images.length === 0 && (
                        <>
                          <p className="text-sm font-semibold text-gray-500 mt-2">Add Product Photos</p>
                          <p className="text-xs text-gray-400 mt-1">Tap to upload or take photo</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>

                <div className="mt-3 flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    First photo will be the main display photo. Add up to 5 photos. Clear, well-lit photos sell better!
                  </p>
                </div>
              </div>

              {/* Videos */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="h-5 w-5 text-purple-500" />
                  <h2 className="text-base font-bold text-gray-900">Product Video</h2>
                  <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full ml-auto">Optional</span>
                </div>

                <div className="flex gap-2">
                  {videoUrls.map((_, i) => (
                    <div key={i} className="relative w-24 h-24 bg-gray-900 rounded-xl flex items-center justify-center">
                      <Video className="h-8 w-8 text-white" />
                      <button type="button" onClick={() => removeVideo(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {videos.length < 2 && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
                      <Video className="h-7 w-7 text-gray-300" />
                      <span className="text-[10px] text-gray-400 mt-1">Add Video</span>
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Videos help customers see your product better. Max 2 videos.</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Basic Details ── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Product Details</h2>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setValue('categoryType', cat.value as ProductCategoryType)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                          watchedValues.categoryType === cat.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-100 hover:border-gray-200'
                        )}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.categoryType && <p className="text-xs text-red-500 mt-1">{errors.categoryType.message}</p>}
                </div>

                {/* Product name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Fresh Organic Tomatoes 1kg"
                    className="h-11 rounded-xl"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Description
                    <span className="text-xs font-normal text-gray-400 ml-2">(Optional but recommended)</span>
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Tell customers about your product — freshness, size, quality, how to use..."
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>

                {/* Brand */}
                <div>
                  <Label htmlFor="brand" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Brand <span className="text-xs font-normal text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="brand"
                    {...register('brand')}
                    placeholder="e.g., Tata, Amul, Local..."
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Price & Stock ── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-green-600" />
                  <h2 className="text-base font-bold text-gray-900">Pricing</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                      <Input
                        id="price"
                        type="number"
                        {...register('price')}
                        placeholder="0"
                        className="pl-7 h-12 rounded-xl text-lg font-bold"
                      />
                    </div>
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="mrp" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      MRP (₹) <span className="text-xs font-normal text-gray-400">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                      <Input
                        id="mrp"
                        type="number"
                        {...register('mrp')}
                        placeholder="0"
                        className="pl-7 h-12 rounded-xl text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount preview */}
                {discount > 0 && (
                  <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-700">🎉 {discount}% discount badge will show!</p>
                      <p className="text-xs text-green-600">
                        Customers save ₹{(watchedValues.mrp! - watchedValues.price!).toFixed(0)}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="stock" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Stock Quantity <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('stock', Math.max(0, (watchedValues.stock || 0) - 1))}
                      className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-primary hover:text-primary transition-colors"
                    >
                      −
                    </button>
                    <Input
                      id="stock"
                      type="number"
                      {...register('stock')}
                      className="h-11 rounded-xl text-center text-lg font-bold flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setValue('stock', (watchedValues.stock || 0) + 1)}
                      className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-primary hover:text-primary transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
                </div>

                <div>
                  <Label htmlFor="sku" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    SKU / Item Code <span className="text-xs font-normal text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="e.g., TOM-ORG-1KG"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Preview & Publish ── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Preview card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="aspect-video relative bg-gray-100">
                  {imageUrls[0] ? (
                    <img src={imageUrls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-200" />
                    </div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    {categoryOptions.find(c => c.value === watchedValues.categoryType)?.emoji}{' '}
                    {categoryOptions.find(c => c.value === watchedValues.categoryType)?.label}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900">{watchedValues.name || 'Product Name'}</h3>
                  {watchedValues.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{watchedValues.description}</p>
                  )}
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl font-black">₹{watchedValues.price || 0}</span>
                    {watchedValues.mrp && watchedValues.mrp > watchedValues.price && (
                      <span className="text-sm text-gray-400 line-through">₹{watchedValues.mrp}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Stock: {watchedValues.stock || 0} units</p>
                </div>
              </div>

              {/* Thumbnail strip */}
              {imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Summary checklist */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Product Summary</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Photos', value: `${images.length} photo(s) added`, ok: images.length > 0 },
                    { label: 'Videos', value: videos.length > 0 ? `${videos.length} video(s)` : 'None (optional)', ok: true },
                    { label: 'Category', value: categoryOptions.find(c => c.value === watchedValues.categoryType)?.label || '—', ok: !!watchedValues.categoryType },
                    { label: 'Name', value: watchedValues.name || '—', ok: !!watchedValues.name },
                    { label: 'Price', value: watchedValues.price ? `₹${watchedValues.price}` : '—', ok: !!watchedValues.price },
                    { label: 'Stock', value: `${watchedValues.stock || 0} units`, ok: watchedValues.stock >= 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-xs font-medium text-gray-500">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-800 font-semibold truncate max-w-[150px]">{item.value}</span>
                        <CheckCircle className={cn('h-3.5 w-3.5 flex-shrink-0', item.ok ? 'text-green-500' : 'text-gray-300')} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Review Process</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    Your product will be reviewed by our team within 24 hours. You'll be notified once it's approved and live.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(p => p - 1)}
              className="flex-1 h-12 rounded-xl font-semibold"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl font-bold text-base"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl font-bold text-base bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Submit Product</>
              )}
            </Button>
          )}
        </div>

        <div className="h-24" />
      </form>
    </div>
  );
}
