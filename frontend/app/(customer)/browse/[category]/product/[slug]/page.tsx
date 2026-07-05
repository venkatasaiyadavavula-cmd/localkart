'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Store, Truck, Shield, RotateCcw,
  Minus, Plus, Heart, Share2, ChevronLeft, Play,
  X, ShoppingBag, CheckCircle, Clock, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProductVideoPlayer } from '@/components/video/product-video-player';
import { ProductReviews } from '@/components/reviews/product-reviews';
import { useProduct } from '@/hooks/use-product';
import { useCartStore } from '@/store/cart-store';
import { useBuyNowWithWelcome } from '@/hooks/use-buy-now-with-welcome';
import { formatPrice, formatDistance } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const slug     = params.slug as string;

  const { data: product, isLoading } = useProduct(slug);
  const { addItem, isLoading: cartLoading } = useCartStore();
  const { startBuyNow, buyNowWelcomeDialog, isBuyNowLoading } = useBuyNowWithWelcome();

  const [quantity,       setQuantity]       = useState(1);
  const [selectedImage,  setSelectedImage]  = useState(0);
  const [showVideo,      setShowVideo]      = useState(false);
  const [isWishlisted,   setIsWishlisted]   = useState(false);
  const [addedToCart,    setAddedToCart]    = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product.id, quantity);
      setAddedToCart(true);
      toast.success(`${quantity} item(s) added to cart!`);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    startBuyNow(product.id, quantity);
  };

  const handleWishlist = async () => {
    if (!product) return;
    setWishlistLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.post(
        `${API}/wishlist/toggle`,
        { productId: product.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = data?.data ?? data;
      setIsWishlisted(result.added);
      toast.success(result.added ? '❤️ Added to wishlist!' : 'Removed from wishlist');
    } catch {
      toast.error('Login to save to wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${product?.name} — ${formatPrice(product?.price || 0)} — LocalKart lo check cheyyandi!`;
    try {
      await navigator.share({ title: product?.name, text, url });
    } catch {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
      window.open(waUrl, '_blank');
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">😕</span>
        <h2 className="text-xl font-bold text-gray-800">Product not found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const savings = product.mrp && product.mrp > product.price
    ? product.mrp - product.price : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {buyNowWelcomeDialog}
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{product.name}</span>
        <div className="flex items-center gap-2">
          <button onClick={handleWishlist} disabled={wishlistLoading} className="p-1.5 hover:bg-gray-100 rounded-full">
            <Heart className={cn('h-5 w-5', isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600')} />
          </button>
          <button onClick={handleShare} className="p-1.5 hover:bg-gray-100 rounded-full">
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Breadcrumb — desktop */}
      <div className="hidden lg:flex items-center gap-2 px-6 py-3 max-w-7xl mx-auto text-xs text-gray-500">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/browse" className="hover:text-primary">Browse</Link>
        <ChevronRight className="h-3 w-3" />
        {product.categoryType && (
          <>
            <Link href={`/browse/${product.categoryType}`} className="hover:text-primary capitalize">
              {product.categoryType.replace('_', ' ')}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto lg:px-6 lg:pb-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          {/* Image Gallery */}
          <div className="bg-white lg:rounded-2xl overflow-hidden">
            <div className="relative bg-gray-50">
              <AnimatePresence mode="wait">
                <motion.div key={selectedImage} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="aspect-square relative">
                  <Image src={product.images?.[selectedImage] || '/assets/placeholders/product-placeholder.svg'} alt={product.name} fill className="object-contain p-4" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                </motion.div>
              </AnimatePresence>

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{discount}% OFF</span>}
                {product.stock <= 5 && product.stock > 0 && <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Only {product.stock} left!</span>}
              </div>

              {product.videos?.length > 0 && (
                <button onClick={() => setShowVideo(true)} className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 text-white text-xs font-semibold px-3 py-2 rounded-full hover:bg-black/80 transition-colors">
                  <Play className="h-3.5 w-3.5 fill-white" /> Watch Video
                </button>
              )}

              <div className="hidden lg:flex absolute top-4 right-4 flex-col gap-2">
                <button onClick={handleWishlist} disabled={wishlistLoading} className="bg-white p-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow">
                  <Heart className={cn('h-5 w-5', isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
                </button>
                <button onClick={handleShare} className="bg-white p-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow">
                  <Share2 className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-t bg-white">
                {product.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={cn('relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all', selectedImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100')}>
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white lg:rounded-2xl p-4 lg:p-6 mt-2 lg:mt-0">
            <Link href={`/shop/${product.shop?.slug}`} className="inline-flex items-center gap-2 text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-full mb-3 hover:bg-primary/20 transition-colors">
              <Store className="h-3.5 w-3.5" />
              {product.shop?.name}
              {product.shop?.distance && (
                <span className="flex items-center gap-0.5 text-gray-500">
                  <MapPin className="h-3 w-3" /> {formatDistance(product.shop.distance)}
                </span>
              )}
            </Link>

            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-lg">
                <Star className="h-3.5 w-3.5 fill-green-600 text-green-600" />
                <span className="text-xs font-bold text-green-700">{product.rating || '4.2'}</span>
              </div>
              {product.reviewCount > 0 && <span className="text-xs text-gray-500">{product.reviewCount} reviews</span>}
              {product.orderCount > 0 && <><span className="text-gray-300">•</span><span className="text-xs text-gray-500">{product.orderCount}+ sold</span></>}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-black text-gray-900">{formatPrice(product.price)}</span>
                {product.mrp && product.mrp > product.price && <span className="text-base text-gray-400 line-through">{formatPrice(product.mrp)}</span>}
                {discount > 0 && <span className="text-sm font-bold text-green-600">{discount}% off</span>}
              </div>
              {savings > 0 && <p className="text-xs text-green-600 font-semibold">🎉 You save {formatPrice(savings)}!</p>}
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {product.stock > 0 ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" /> In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-500">Out of Stock</span>
              )}
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-600 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="px-3 py-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-base font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} disabled={quantity >= (product.stock || 99)} className="px-3 py-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-800">{formatPrice(product.price * quantity)}</span></span>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <Button size="lg" variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/5 font-bold" onClick={handleAddToCart} disabled={cartLoading || product.stock === 0}>
                {addedToCart ? <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Added!</span> : <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Add to Cart</span>}
              </Button>
              <Button size="lg" className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold" onClick={handleBuyNow} disabled={isBuyNowLoading || cartLoading || product.stock === 0}>
                Buy Now
              </Button>
            </div>

            <div className="space-y-2.5 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              {[
                { icon: Truck,    title: 'Same Day Delivery', sub: 'Order before 4 PM for today delivery', color: 'text-blue-500' },
                { icon: Shield,   title: 'Cash on Delivery',    sub: 'Pay when your order arrives',   color: 'text-green-500' },
                { icon: RotateCcw, title: '24h Easy Returns',  sub: 'Return within 24 hours of delivery',   color: 'text-orange-500' },
                { icon: Clock,    title: 'Local Shop',        sub: 'Fresh products from your neighborhood', color: 'text-purple-500' },
              ].map(({ icon: Icon, title, sub, color }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 ${color} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{title}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white mt-2 lg:mt-6 lg:rounded-2xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-5 py-3 text-sm font-semibold">
                  {tab === 'reviews' ? `Reviews (${product.reviewCount || 0})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="description" className="px-4 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">{product.description || 'No description available.'}</p>
            </TabsContent>

            <TabsContent value="specifications" className="px-4 py-5">
              {product.attributes && Object.keys(product.attributes).length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex py-2.5">
                      <span className="w-2/5 text-xs font-semibold text-gray-600 capitalize">{key}</span>
                      <span className="w-3/5 text-xs text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specifications available.</p>
              )}
            </TabsContent>

            {/* ✅ Real reviews component */}
            <TabsContent value="reviews" className="p-0">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Button variant="outline" className="flex-1 border-primary text-primary font-bold" onClick={handleAddToCart} disabled={cartLoading || product.stock === 0}>
          {addedToCart ? '✓ Added!' : 'Add to Cart'}
        </Button>
        <Button className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold" onClick={handleBuyNow} disabled={isBuyNowLoading || cartLoading || product.stock === 0}>
          Buy Now
        </Button>
      </div>

      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl">
          <button onClick={() => setShowVideo(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
            <X className="h-4 w-4" />
          </button>
          {product.videos?.[0] && <ProductVideoPlayer src={product.videos[0]} />}
        </DialogContent>
      </Dialog>

      <div className="h-32 lg:hidden" />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto lg:px-6 lg:py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          <Skeleton className="aspect-square w-full lg:rounded-2xl" />
          <div className="p-4 bg-white mt-2 lg:mt-0 lg:rounded-2xl space-y-4">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
