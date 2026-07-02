'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import axios from 'axios';
import { normalizeList, unwrapApiData } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const VISUAL_CATEGORIES = [
  'groceries',
  'fashion',
  'electronics',
  'home_essentials',
  'beauty',
  'accessories',
] as const;

interface VisualSearchButtonProps {
  onResults: (products: unknown[]) => void;
}

export function VisualSearchButton({ onResults }: VisualSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const captureAndSearch = async () => {
    setLoading(true);
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        toast.error('Failed to capture image');
        return;
      }

      let categoryType: string | undefined;

      try {
        const { pipeline } = await import('@xenova/transformers');
        const classifier = await pipeline(
          'zero-shot-image-classification',
          'Xenova/clip-vit-base-patch32',
        );
        const output = await classifier(imageSrc, [...VISUAL_CATEGORIES]);
        const top = Array.isArray(output) ? output[0] : null;
        categoryType = top?.label;
      } catch (mlError) {
        console.warn('CLIP classification unavailable, using general search', mlError);
      }

      const { data } = await axios.post(`${API_URL}/catalog/visual-search`, {
        categoryType,
        limit: 12,
      });

      const products = normalizeList(unwrapApiData(data));
      onResults(products);
      setOpen(false);
      toast.success(
        products.length
          ? `Found ${products.length} similar products${categoryType ? ` in ${categoryType.replace('_', ' ')}` : ''}`
          : 'No matching products found',
      );
    } catch (error) {
      console.error('Visual search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
        title="Search by image"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="h-full w-full object-cover"
              videoConstraints={{
                facingMode: 'environment',
                width: 1080,
                height: 1080,
              }}
            />
            <Button
              size="lg"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-xl"
              onClick={captureAndSearch}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Capture & Search
                </>
              )}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Point camera at a product to find similar items by category
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
