'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Plus, Trash2, Loader2, Clock, Zap,
  Tag, TrendingUp, ChevronRight, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

export default function SellerOffersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['seller-daily-offers'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/seller/daily-offers`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['seller-products-for-offer'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/seller/products?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { productId: string; offerPrice: number }) => {
      await axios.post(`${API_URL}/seller/daily-offers`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-daily-offers'] });
      setOpen(false);
      setSelectedProduct(null);
      setOfferPrice('');
      toast.success('🎉 Offer created! Customers can see it now.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create offer'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/seller/daily-offers/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-daily-offers'] });
      toast.success('Offer removed');
    },
  });

  const offerDiscount = selectedProduct && offerPrice
    ? Math.round(((selectedProduct.price - Number(offerPrice)) / selectedProduct.price) * 100)
    : 0;

  const savings = selectedProduct && offerPrice
    ? selectedProduct.price - Number(offerPrice)
    : 0;

  const filteredProducts = products?.filter((p: any) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) && p.status === 'approved'
  ) || [];

  const activeCount = offers?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daily Offers</h1>
            <p className="text-xs text-gray-500">{activeCount}/5 active offers · Expire in 24h</p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            disabled={activeCount >= 5}
            size="sm"
            className="h-9 rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" /> New Offer
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
        <Zap className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-orange-800">Boost your sales with Daily Deals!</p>
          <p className="text-xs text-orange-600 mt-0.5">
            Products on offer get 3x more visibility on the home screen. Offers expire after 24 hours.
          </p>
        </div>
      </div>

      {/* Offers grid */}
      <div className="px-4 mt-4 space-y-3">
        {offersLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          : offers?.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-5xl mb-3">🏷️</span>
              <p className="font-semibold text-gray-600">No active offers</p>
              <p className="text-xs text-gray-400 mt-1">Create an offer to attract more customers</p>
              <Button onClick={() => setOpen(true)} className="mt-4 rounded-xl" size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Create First Offer
              </Button>
            </div>
          )
          : offers?.map((offer: any) => {
            const hoursLeft = Math.max(0, Math.round((new Date(offer.expiresAt).getTime() - Date.now()) / 3600000));
            const urgent = hoursLeft < 3;

            return (
              <div key={offer.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{offer.product?.name}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-primary">{formatPrice(offer.offerPrice)}</span>
                        <span className="text-sm text-gray-400 line-through">{formatPrice(offer.originalPrice)}</span>
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                          -{offer.discountPercentage}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Customers save {formatPrice(offer.originalPrice - offer.offerPrice)}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteMutation.mutate(offer.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Timer */}
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${urgent ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <Clock className={`h-3.5 w-3.5 ${urgent ? 'text-red-500' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold ${urgent ? 'text-red-600' : 'text-gray-500'}`}>
                      {urgent ? '⚠️ Expiring soon! ' : ''}{hoursLeft}h left · Expires {new Date(offer.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>

      {/* Create Offer Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" /> Create Daily Offer
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            {/* Product selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Select Product
              </Label>
              <Input
                placeholder="Search your products..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="mb-2 rounded-xl"
              />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setOfferPrice(''); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                      selectedProduct?.id === p.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">{p.name}</p>
                      <p className="text-xs text-gray-500">Current price: {formatPrice(p.price)}</p>
                    </div>
                    {selectedProduct?.id === p.id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No approved products found</p>
                )}
              </div>
            </div>

            {/* Offer price */}
            {selectedProduct && (
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Offer Price (₹) — Must be less than {formatPrice(selectedProduct.price)}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                  <Input
                    type="number"
                    placeholder="Enter offer price"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="pl-7 h-12 rounded-xl text-lg font-bold"
                    max={selectedProduct.price - 1}
                  />
                </div>

                {/* Quick discount buttons */}
                <div className="flex gap-2 mt-2">
                  {[10, 20, 30, 50].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setOfferPrice(String(Math.round(selectedProduct.price * (1 - pct / 100))))}
                      className="flex-1 py-2 text-xs font-bold bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>

                {/* Live preview */}
                {offerPrice && Number(offerPrice) > 0 && Number(offerPrice) < selectedProduct.price && (
                  <div className="mt-3 bg-green-50 border border-green-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-green-700 mb-2">📣 Offer Preview</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-green-700">{formatPrice(Number(offerPrice))}</span>
                      <span className="text-sm text-gray-400 line-through">{formatPrice(selectedProduct.price)}</span>
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                        -{offerDiscount}% OFF
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      🎉 Customers save {formatPrice(savings)} — This will show on home page!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                This offer will appear on the home page and automatically expire in 24 hours.
              </p>
            </div>

            <Button
              onClick={() => createMutation.mutate({
                productId: selectedProduct.id,
                offerPrice: Number(offerPrice),
              })}
              disabled={
                !selectedProduct || !offerPrice ||
                Number(offerPrice) >= selectedProduct?.price ||
                Number(offerPrice) <= 0 ||
                createMutation.isPending
              }
              className="w-full h-12 rounded-xl font-bold text-base bg-orange-500 hover:bg-orange-600"
            >
              {createMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</>
                : <><Zap className="h-4 w-4 mr-2" /> Create Offer Now</>
              }
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
