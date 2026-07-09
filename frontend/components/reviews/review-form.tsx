'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { API_URL as API } from '@/lib/api-config';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

interface Props {
  productId:   string;
  productName: string;
  shopId:      string;
  orderId:     string;
  onDone?:     () => void;
}

export function ReviewForm({ productId, productName, shopId, orderId, onDone }: Props) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const qc = useQueryClient();

  const { data: canData } = useQuery({
    queryKey: ['can-review', productId],
    queryFn:  async () => {
      const { data } = await axios.get(`${API}/reviews/can-review/${productId}`, { headers: auth() });
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(
        `${API}/reviews`,
        { productId, shopId, orderId, rating, comment },
        { headers: auth() },
      );
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Review submitted! Thank you.');
      qc.invalidateQueries({ queryKey: ['product-reviews', productId] });
      qc.invalidateQueries({ queryKey: ['can-review', productId] });
      onDone?.();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to submit review'),
  });

  if (canData?.alreadyDone) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: '#ECFDF5', border: '1px solid rgba(5,150,105,0.20)' }}>
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#059669' }} />
        <p className="text-sm font-semibold" style={{ color: '#065F46' }}>You have already reviewed this product</p>
      </div>
    );
  }

  if (!canData?.canReview) return null;

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const active  = hovered || rating;

  return (
    <div className="rounded-2xl border p-4 space-y-4" style={{ background: 'white', borderColor: '#E5E9F2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div>
        <p className="text-sm font-extrabold text-gray-800">Rate this product</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{productName}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} className="transition-transform duration-100 hover:scale-110 active:scale-95">
            <Star className="h-8 w-8" style={{ color: s <= active ? '#F59E0B' : '#E5E7EB', fill: s <= active ? '#F59E0B' : 'transparent', transition: 'color 0.1s, fill 0.1s' }} />
          </button>
        ))}
        {active > 0 && <span className="text-sm font-bold ml-2" style={{ color: '#F59E0B' }}>{LABELS[active]}</span>}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        rows={3}
        className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none"
        style={{ background: '#F8F9FC', border: '1.5px solid #E5E9F2', color: '#374151', fontFamily: 'inherit' }}
      />

      <button
        onClick={() => mutation.mutate()}
        disabled={rating === 0 || mutation.isPending}
        className="flex items-center gap-2 text-sm font-extrabold text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: rating > 0 ? '0 4px 16px rgba(61,90,241,0.30)' : 'none' }}
      >
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit Review</>}
      </button>
    </div>
  );
}
