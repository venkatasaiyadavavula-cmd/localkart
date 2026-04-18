'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface VisualSearchButtonProps {
  onResults: (products: any[]) => void;
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

      // Load MobileNet model (cached after first load)
      const model = await mobilenet.load();

      // Create image element from base64
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      // Get embedding (512-dimensional vector)
      const embedding = model.infer(img, true) as any;
      const embeddingArray = Array.from(embedding.dataSync());

      // Send embedding to backend
      const { data } = await axios.post(`${API_URL}/catalog/visual-search`, {
        embedding: embeddingArray,
      });

      onResults(data.data);
      setOpen(false);
      toast.success(`Found ${data.data.length} similar products`);
    } catch (error: any) {
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
            Point camera at a product to find similar items
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
