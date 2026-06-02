'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, MapPin, Store, Truck, Shield, RotateCcw,
  Minus, Plus, Heart, Share2, ChevronLeft, Play,
  X, CheckCircle2, Package, Clock, ChevronRight,
  ShoppingBag, Tag, Zap, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useProduct } from '@/hooks/use-product';
import { useProducts } from '@/hooks/use-products';
import { useCartStore } from '@/store/cart-store';
import { formatPrice, formatDistance } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/product-card';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const category = params.category as string;

  const { data: product, isLoading } = useProduct(slug);
  const { addItem, isLoading: cartLoading } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState('');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: similarProducts } = useProducts({ categoryType: category, limit: 6 });

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product.id, quantity);
      setAddedToCart(true);
      toast.success(`${quantity} item(s) added to cart! 🛒`);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch {
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await addItem(product.id, quantity);
      router.push('/checkout');
    } catch {
      toast.error('Failed. Please try again.');
    }
  };

  const handlePincodeCheck = () => {
    if (pincode.length !== 6) { setPincodeMsg('Enter valid 6-digit pincode'); return; }
    setPincodeMsg('✅ Delivery available! Expected today by 8 PM');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-5xl">😕</p>
        <p className="text-lg font-semibold text-gray-700">Product not found</p>
        <button onClick={() => router.back()} className="text-primary text-sm font-medium underline">Go back</button>
      </div>
    );
  }

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const images = product.images?.length ? product.images : ['/placeholder.png'];
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Mobile Back Header */}
      <div className="sticky top-0 z-40 bg-white border-b flex items-center justify-between px-4 py-3 lg:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-700">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsWishlisted(!isWishlisted)}>
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <button onClick={handleShare}>
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:px-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">

          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative bg-white">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded">
                    {discount}% OFF
                  </div>
                )}
                {product.videos?.length > 0 && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute bottom-4 left-4 bg-black/70 text-white rounded-full flex items-center gap-2 px-3 py-2 text-xs font-medium"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Watch Video
                  </button>
                )}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {selectedImage + 1}/{images.length}
                </div>
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white lg:px-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white lg:bg-transparent">
            <div className="px-4 pt-4 lg:px-0 lg:pt-0">
              <Link
                href={`/shop/${product.shop?.slug}`}
                className="inline-flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-full mb-3"
              >
                <Store className="h-3.5 w-3.5" />
                {product.shop?.name}
                {product.shop?.distance && (
                  <span className="flex items-center gap-0.5 text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(product.shop.distance)}
                  </span>
                )}
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </Link>

              <h1 className="text-lg font-bold text-gray-900 leading-snug lg:text-2xl">{product.name}</h1>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  <span>{product.rating || '4.2'}</span>
                  <Star className="h-2.5 w-2.5 fill-white" />
                </div>
                {product.reviewCount > 0 && <span className="text-xs text-gray-500">{product.reviewCount} ratings</span>}
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500">{product.orderCount || 0}+ sold</span>
              </div>
            </div>

            {/* Price */}
            <div className="px-4 py-4 lg:px-0 bg-gray-50 mt-3 lg:bg-transparent lg:mt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-gray-900">{formatPrice(product.price)}</span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="text-base text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                    <span className="text-sm font-bold text-green-600">{discount}% off</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Inclusive of all taxes</p>
            </div>

            {/* Stock */}
            <div className="px-4 lg:px-0 mb-3 mt-3">
              {inStock ? (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  In Stock ({product.stock} left)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                  <X className="h-4 w-4" /> Out of Stock
                </div>
              )}
            </div>

            {/* Quantity */}
            {inStock && (
              <div className="px-4 lg:px-0 mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Quantity</p>
                <div className="flex items-center gap-3 w-fit border border-gray-200 rounded-lg overflow-hidden">
                  <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-base font-bold">{quantity}</span>
                  <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Pincode check */}
            <div className="px-4 lg:px-0 mb-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-gray-800">Check Delivery</span>
                </div>
                <div className="p-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter pincode"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => { setPincode(e.target.value); setPincodeMsg(''); }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={handlePincodeCheck} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90">
                      Check
                    </button>
                  </div>
                  {pincodeMsg && (
                    <p className={`text-xs mt-2 font-medium ${pincodeMsg.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                      {pincodeMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Promises */}
            <div className="px-4 lg:px-0 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Clock, title: 'Same Day', sub: 'Delivery' },
                  { icon: Shield, title: 'Secure', sub: 'Payment' },
                  { icon: RotateCcw, title: '24h', sub: 'Returns' },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex flex-col items-center gap-1 border border-gray-100 rounded-xl py-3 bg-white">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="text-xs font-bold text-gray-800">{title}</p>
                    <p className="text-[10px] text-gray-500">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="px-4 lg:px-0 mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Product Description</h3>
              <div className={`text-sm text-gray-600 leading-relaxed ${!showFullDesc && 'line-clamp-3'}`}>
                {product.description || 'No description available.'}
              </div>
              {product.description?.length > 150 && (
                <button onClick={() => setShowFullDesc(!showFullDesc)} className="flex items-center gap-1 text-primary text-xs font-semibold mt-1">
                  {showFullDesc ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Read more <ChevronDown className="h-3 w-3" /></>}
                </button>
              )}
            </div>

            {/* Specifications */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="px-4 lg:px-0 mb-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2">Specifications</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {Object.entries(product.attributes).map(([key, value], i) => (
                    <div key={key} className={`flex ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <span className="w-2/5 px-3 py-2.5 text-xs text-gray-500 font-medium border-r border-gray-100">{key}</span>
                      <span className="flex-1 px-3 py-2.5 text-xs text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop buttons */}
            <div className="hidden lg:flex gap-3 px-4 lg:px-0 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || cartLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 transition-all ${
                  addedToCart ? 'border-green-500 bg-green-50 text-green-600' : 'border-primary bg-white text-primary hover:bg-primary/5'
                } disabled:opacity-50`}
              >
                {addedToCart ? <><CheckCircle2 className="h-5 w-5" /> Added!</> : <><ShoppingBag className="h-5 w-5" /> Add to Cart</>}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock || cartLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <Zap className="h-5 w-5" /> Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts?.length > 0 && (
          <div className="mt-6 bg-white lg:rounded-xl lg:p-4">
            <div className="px-4 py-3 flex items-center justify-between lg:px-0">
              <h2 className="text-sm font-bold text-gray-800">Similar Products</h2>
              <Link href={`/browse/${category}`} className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-0.5 lg:grid-cols-6 lg:gap-3">
              {similarProducts.slice(0, 6).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t px-4 py-3 flex gap-3 lg:hidden">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || cartLoading}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
            addedToCart ? 'border-green-500 bg-green-50 text-green-600' : 'border-primary bg-white text-primary'
          } disabled:opacity-50`}
        >
          {addedToCart ? <><CheckCircle2 className="h-4 w-4" /> Added!</> : <><ShoppingBag className="h-4 w-4" /> Add to Cart</>}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock || cartLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-primary text-white disabled:opacity-50"
        >
          <Zap className="h-4 w-4" /> Buy Now
        </button>
      </div>

      {/* Video Modal */}
      {showVideo && product.videos?.[0] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowVideo(false)} className="absolute -top-10 right-0 text-white">
              <X className="h-6 w-6" />
            </button>
            <video src={product.videos[0]} controls autoPlay className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto lg:px-6 lg:py-8 lg:grid lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
