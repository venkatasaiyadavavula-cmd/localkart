'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MapPin,
  Store,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Heart,
  Share2,
  ChevronLeft,
  Play,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProductVideoPlayer } from '@/components/video/product-video-player';
import { useProduct } from '@/hooks/use-product';
import { useCartStore } from '@/store/cart-store';
import { formatPrice, formatDistance } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: product, isLoading } = useProduct(slug);
  const { addItem, isLoading: cartLoading } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product.id, quantity);
      toast.success(`Added ${quantity} item(s) to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div className="container py-6 md:py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary md:hidden"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-muted">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="aspect-square"
              >
                <Image
                  src={product.images?.[selectedImage] || '/assets/placeholders/product-placeholder.svg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Video Play Button */}
            {product.videos && product.videos.length > 0 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-4 left-4 h-12 w-12 rounded-full shadow-lg"
                onClick={() => setShowVideo(true)}
              >
                <Play className="h-5 w-5" />
              </Button>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <Badge className="absolute right-4 top-4 bg-accent px-3 py-1 text-sm font-bold">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image src={image} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Shop Link */}
          <Link
            href={`/shop/${product.shop.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <Store className="h-4 w-4" />
            {product.shop.name}
            {product.shop.distance && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {formatDistance(product.shop.distance)}
              </span>
            )}
          </Link>

          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.rating || 'New'}</span>
                {product.reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground">({product.reviewCount} reviews)</span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{product.orderCount}+ sold</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          <div>
            <p className="mb-2 text-sm font-medium">Quantity</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {product.stock} available
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={handleAddToCart}
              disabled={cartLoading}
            >
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="default"
              className="flex-1 bg-accent hover:bg-accent/90 sm:flex-none"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setIsWishlisted(!isWishlisted)}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 rounded-xl bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Same Day Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Order within 2 hours to get it today
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Secure Payment</p>
                <p className="text-sm text-muted-foreground">COD & Online payments accepted</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">24h Return Policy</p>
                <p className="text-sm text-muted-foreground">Return within 24 hours of delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start border-b bg-transparent p-0">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-6">
            <p className="text-muted-foreground">{product.description || 'No description available.'}</p>
          </TabsContent>
          <TabsContent value="specifications" className="py-6">
            {product.attributes ? (
              <div className="space-y-2">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex border-b py-2">
                    <span className="w-1/3 font-medium">{key}</span>
                    <span className="text-muted-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specifications available.</p>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="py-6">
            <p className="text-muted-foreground">Reviews coming soon.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Dialog */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-3xl p-0">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
          {product.videos && product.videos[0] && (
            <ProductVideoPlayer src={product.videos[0]} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container py-6 md:py-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-11" />
          </div>
        </div>
      </div>
    </div>
  );
}
