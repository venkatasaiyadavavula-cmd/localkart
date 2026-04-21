'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrder } from '@/hooks/use-order';
import { ReturnReason } from '@/types/return';

const returnSchema = z.object({
  reason: z.nativeEnum(ReturnReason),
  description: z.string().optional(),
});

type ReturnFormData = z.infer<typeof returnSchema>;

export default function ReturnRequestPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { data: order, isLoading } = useOrder(orderId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
  });

  const selectedReason = watch('reason');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + evidenceFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setEvidenceFiles((prev) => [...prev, ...files]);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReturnFormData) => {
    if (evidenceFiles.length === 0) {
      toast.error('Please upload at least one photo/video as evidence');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('reason', data.reason);
      if (data.description) formData.append('description', data.description);
      evidenceFiles.forEach((file) => formData.append('evidence', file));

      const response = await fetch('/api/returns', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit return request');
      }

      toast.success('Return request submitted successfully');
      router.push(`/orders/${orderId}`);
    } catch (error) {
      toast.error('Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="h-32 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Check if return is allowed (within 24 hours of delivery)
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const hoursSinceDelivery = deliveredAt
    ? (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60)
    : Infinity;

  if (order.status !== 'delivered' || hoursSinceDelivery > 24) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {order.status !== 'delivered'
                ? 'Return requests can only be made for delivered orders.'
                : 'Return window of 24 hours has expired.'}
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push(`/orders/${orderId}`)}>
            Back to Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        <h1 className="font-heading text-2xl font-bold">Request Return</h1>
        <p className="mt-1 text-muted-foreground">
          Order #{order.orderNumber} • {order.shop.name}
        </p>

        <Card className="mt-6">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Reason */}
              <div className="space-y-3">
                <Label>Reason for Return</Label>
                <RadioGroup
                  onValueChange={(value) => setValue('reason', value as ReturnReason)}
                  className="space-y-2"
                >
                  {Object.values(ReturnReason).map((reason) => (
                    <div key={reason} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason} id={reason} />
                      <Label htmlFor={reason} className="cursor-pointer font-normal capitalize">
                        {reason.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue..."
                  rows={3}
                  {...register('description')}
                />
              </div>

              {/* Evidence Upload */}
              <div className="space-y-3">
                <Label>Upload Evidence (Photo/Video)</Label>
                <p className="text-xs text-muted-foreground">
                  Upload up to 5 photos or videos showing the issue. Required for return approval.
                </p>

                <div className="flex flex-wrap gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                      {evidenceFiles[index].type.startsWith('image/') ? (
                        <img src={url} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {evidenceFiles.length < 5 && (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary">
                      <Upload className="h-5 w-5" />
                      <span className="mt-1 text-xs">Upload</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>
                {evidenceFiles.length === 0 && (
                  <p className="text-xs text-destructive">Please upload at least one file</p>
                )}
              </div>

              {/* Refund Amount */}
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm font-medium">Refund Amount</p>
                <p className="font-heading text-2xl font-bold text-primary">
                  {formatPrice(order.totalAmount - order.deliveryCharge)}
                </p>
                <p className="text-xs text-muted-foreground">
                  (Excluding delivery charge of {formatPrice(order.deliveryCharge)})
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Return Request
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
