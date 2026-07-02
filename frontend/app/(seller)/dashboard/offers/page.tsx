'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import {
  Plus, Trash2, Loader2, Clock, Zap,
  Tag, ChevronRight, Info, Sparkles, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, normalizeList } from '@/lib/utils';
import { getOfferQuestionsForProduct, type OfferQuestion } from '@/lib/daily-offer-questions';
import { OfferCountdown } from '@/components/offers/offer-countdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_OFFERS = 5;

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '');

export default function SellerOffersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['seller-daily-offers'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/seller/daily-offers`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return normalizeList(data);
    },
  });

  const { data: products } = useQuery({
    queryKey: ['seller-products-for-offer'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/seller/products?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return normalizeList(data);
    },
  });

  const offeredTodayProductIds = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return new Set(
      (offers || [])
        .filter((o: any) => new Date(o.createdAt) >= startOfDay)
        .map((o: any) => o.productId),
    );
  }, [offers]);

  const activeProductIds = useMemo(
    () => new Set((offers || []).map((o: any) => o.productId)),
    [offers],
  );

  const questions: OfferQuestion[] = useMemo(
    () => (selectedProduct ? getOfferQuestionsForProduct(selectedProduct) : []),
    [selectedProduct],
  );

  const resetForm = () => {
    setStep(1);
    setSelectedProduct(null);
    setOfferPrice('');
    setSellerNotes('');
    setSearchProduct('');
    setAnswers({});
  };

  const createMutation = useMutation({
    mutationFn: async (payload: {
      productId: string;
      offerPrice: number;
      sellerNotes?: string;
      offerDetails?: Record<string, string | number>;
    }) => {
      await axios.post(`${API_URL}/seller/daily-offers`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-daily-offers'] });
      setOpen(false);
      resetForm();
      toast.success('Daily offer is live on the homepage!');
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

  const filteredProducts =
    products?.filter(
      (p: any) =>
        p.status === 'approved' &&
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) &&
        !activeProductIds.has(p.id) &&
        !offeredTodayProductIds.has(p.id),
    ) || [];

  const activeCount = offers?.length || 0;
  const offerDiscount =
    selectedProduct && offerPrice
      ? Math.round(((selectedProduct.price - Number(offerPrice)) / selectedProduct.price) * 100)
      : 0;

  const requiredAnswered = questions
    .filter((q) => q.required)
    .every((q) => answers[q.key]?.toString().trim());

  const handleCreate = () => {
    if (!selectedProduct || !offerPrice) return;

    const offerDetails: Record<string, string | number> = {};
    questions.forEach((q) => {
      const val = answers[q.key]?.trim();
      if (!val) return;
      offerDetails[q.key] = q.type === 'number' ? Number(val) : val;
    });

    createMutation.mutate({
      productId: selectedProduct.id,
      offerPrice: Number(offerPrice),
      sellerNotes: sellerNotes.trim() || undefined,
      offerDetails: Object.keys(offerDetails).length ? offerDetails : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 via-gray-50 to-gray-50 pb-28">
      {/* Hero header */}
      <div
        className="relative overflow-hidden px-4 pb-8 pt-6 text-white"
        style={{
          background: 'linear-gradient(135deg,#EA580C 0%,#FF6B35 45%,#F97316 100%)',
          boxShadow: '0 16px 48px -16px rgba(234,88,12,0.55)',
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-orange-100">
            Seller Spotlight
          </p>
          <h1
            className="mt-1 text-3xl font-black leading-tight sm:text-4xl"
            style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}
          >
            DAILY
            <br />
            OFFERS
          </h1>
          <p className="mt-2 max-w-sm text-sm text-orange-50/90">
            Put your product on the homepage for 24 hours. One product per day. More visibility, more orders.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              {activeCount}/{MAX_OFFERS} active
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              ⏱ Auto-expires in 24h
            </span>
          </div>
          <Button
            onClick={() => { resetForm(); setOpen(true); }}
            disabled={activeCount >= MAX_OFFERS}
            className="mt-5 h-11 rounded-xl bg-white font-extrabold text-orange-600 hover:bg-orange-50"
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Offer
          </Button>
        </div>
      </div>

      {/* Rules card */}
      <div className="mx-4 -mt-4 relative z-10 rounded-2xl border border-orange-100 bg-white p-4 shadow-lg">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="font-bold text-gray-900">How Daily Offers work</p>
            <p>• <strong>One product per day</strong> — each product can only have one offer every 24 hours</p>
            <p>• Offers appear on the <strong>customer homepage</strong> with a live countdown</p>
            <p>• After 24 hours, the offer <strong>expires automatically</strong> — no action needed</p>
            <p>• Answer product details (size, color, stock) so customers know exactly what they get</p>
          </div>
        </div>
      </div>

      {/* Active offers */}
      <div className="px-4 mt-5 space-y-3">
        <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-500" /> Live Offers
        </h2>

        {offersLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : offers?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white py-14 text-center">
            <span className="text-5xl">🏷️</span>
            <p className="mt-3 font-bold text-gray-700">No live offers yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first deal to appear on the homepage</p>
          </div>
        ) : (
          offers.map((offer: any) => (
            <div
              key={offer.id}
              className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
              style={{ boxShadow: '0 8px 24px -12px rgba(234,88,12,0.2)' }}
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Live on Homepage
                </span>
                <OfferCountdown expiresAt={offer.expiresAt} className="text-white" urgentClassName="text-yellow-200" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">{offer.product?.name}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-orange-600">{formatPrice(offer.offerPrice)}</span>
                      <span className="text-sm text-gray-400 line-through">{formatPrice(offer.originalPrice)}</span>
                      <span className="rounded-lg bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        -{offer.discountPercentage}%
                      </span>
                    </div>
                    {offer.sellerNotes && (
                      <p className="mt-2 text-xs text-gray-500 italic">"{offer.sellerNotes}"</p>
                    )}
                    {offer.offerDetails && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(offer.offerDetails).map(([k, v]) => (
                          <span key={k} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(offer.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-xl bg-red-50 p-2.5 text-red-500 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create sheet */}
      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-10">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-xl font-black">
              <Zap className="h-5 w-5 text-orange-500" />
              {step === 1 ? 'Choose Product' : 'Offer Details'}
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              Step {step} of 2 · Expires automatically in 24 hours
            </p>
          </SheetHeader>

          {step === 1 && (
            <div className="space-y-4">
              <Input
                placeholder="Search approved products..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="rounded-xl"
              />
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setAnswers({});
                      setStep(2);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border-2 border-gray-100 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(p.price)} · Stock: {p.stock}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-xs text-gray-400">
                    No eligible products. Products already on offer today are hidden.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="space-y-5">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                <p className="text-sm font-bold text-orange-900">{selectedProduct.name}</p>
                <p className="text-xs text-orange-700">Current price: {formatPrice(selectedProduct.price)}</p>
                <button onClick={() => setStep(1)} className="mt-1 text-xs font-semibold text-orange-600 underline">
                  Change product
                </button>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-bold">Offer Price (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <Input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="h-12 rounded-xl pl-7 text-lg font-bold"
                    placeholder="Must be less than regular price"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[10, 20, 30, 40].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setOfferPrice(String(Math.round(selectedProduct.price * (1 - pct / 100))))
                      }
                      className="flex-1 rounded-xl bg-orange-100 py-2 text-xs font-bold text-orange-700"
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
                {offerPrice && Number(offerPrice) < selectedProduct.price && (
                  <p className="mt-2 text-xs font-semibold text-green-700">
                    Customers save {formatPrice(selectedProduct.price - Number(offerPrice))} ({offerDiscount}% off)
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Product details for customers
                </p>
                {questions.map((q) => (
                  <div key={q.key}>
                    <Label className="text-xs font-semibold text-gray-700">
                      {q.label}
                      {q.required && <span className="text-red-500"> *</span>}
                    </Label>
                    {q.type === 'textarea' ? (
                      <Textarea
                        value={answers[q.key] || ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                        placeholder={q.placeholder}
                        className="mt-1 rounded-xl"
                      />
                    ) : q.type === 'select' && q.options ? (
                      <select
                        value={answers[q.key] || ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        {q.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={q.type === 'number' ? 'number' : 'text'}
                        value={answers[q.key] || ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                        placeholder={q.placeholder}
                        max={q.key === 'offerStock' ? selectedProduct.stock : undefined}
                        className="mt-1 rounded-xl"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Note to customers (optional)</Label>
                <Textarea
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  placeholder="e.g. Limited stock — first come first served!"
                  className="mt-1 rounded-xl"
                  maxLength={500}
                />
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Important:</strong> This offer will automatically disappear from the homepage after{' '}
                  <strong>24 hours</strong>. You can create a new offer for the same product tomorrow.
                </p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={
                  !offerPrice ||
                  Number(offerPrice) <= 0 ||
                  Number(offerPrice) >= selectedProduct.price ||
                  !requiredAnswered ||
                  createMutation.isPending
                }
                className="h-12 w-full rounded-xl bg-orange-500 text-base font-bold hover:bg-orange-600"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Publish to Homepage
                  </>
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
