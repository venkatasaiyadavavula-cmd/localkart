'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Star, ThumbsUp, CheckCircle2, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, unwrapApiData } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

interface Props {
  productId: string;
}

export function ProductReviews({ productId }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/reviews/product/${productId}`);
      return unwrapApiData(data);
    },
  });

  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', productId],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API}/reviews/can-review?productId=${productId}`, {
          headers: auth(),
        });
        return unwrapApiData<{ canReview: boolean; orderId?: string }>(data) ?? { canReview: false };
      } catch {
        return { canReview: false };
      }
    },
  });

  const submitReview = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/reviews`, {
        productId,
        orderId: canReviewData.orderId,
        rating,
        comment,
      }, { headers: auth() });
      toast.success('Review submitted! Thank you 🎉');
      setShowForm(false);
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await axios.put(`${API}/reviews/${reviewId}/helpful`, {}, { headers: auth() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', productId] }),
  });

  const avgRating = reviewData?.reviews?.length
    ? reviewData.reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviewData.reviews.length
    : 0;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="px-4 py-5">
      {/* Rating summary */}
      <div className="flex items-start gap-6 mb-5">
        <div className="text-center">
          <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={cn('h-4 w-4', s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200')} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{reviewData?.total || 0} reviews</p>
        </div>

        {/* Rating bars */}
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map(star => {
            const count = reviewData?.ratingBreakdown?.find((r: any) => r.rating == star)?.count || 0;
            const pct = reviewData?.total ? (count / reviewData.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3">{star}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-4">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write review button */}
      {canReviewData?.canReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary font-semibold text-sm rounded-xl mb-5 hover:bg-primary/20 transition-colors"
        >
          <Star className="h-4 w-4" /> Write a Review
        </button>
      )}

      {canReviewData?.alreadyReviewed && (
        <div className="flex items-center gap-2 py-3 bg-green-50 text-green-700 font-semibold text-sm rounded-xl mb-5 px-4">
          <CheckCircle2 className="h-4 w-4" /> You've reviewed this product
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Your Review</h3>

          {/* Star selector */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                >
                  <Star className={cn(
                    'h-8 w-8 transition-colors',
                    s <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                  )} />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <span className="text-sm font-semibold text-gray-700">
                {ratingLabels[hovered || rating]}
              </span>
            )}
          </div>

          <Textarea
            placeholder="Tell others about your experience..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="rounded-xl resize-none mb-3"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={submitting || rating === 0}
              className="flex-1 rounded-xl"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded" />
            </div>
          ))
        ) : reviewData?.reviews?.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">No reviews yet. Be the first to review!</p>
        ) : (
          reviewData?.reviews?.map((review: any) => (
            <div key={review.id} className="pb-4 border-b last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-800">{review.customer.name}</span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200')} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {format(new Date(review.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{review.comment}</p>
              )}
              <button
                onClick={() => helpfulMutation.mutate(review.id)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful ({review.helpfulCount})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
