'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera, X, Check, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ProductScannerFreeProps {
  onScanComplete: (images: string[], detectedText?: string) => void;
}

export function ProductScannerFree({ onScanComplete }: ProductScannerFreeProps) {
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<'preview' | 'capturing' | 'review'>('preview');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startCapture = () => {
    setMode('capturing');
    setCapturedImages([]);
    
    // Auto capture 5 frames with 0.5s interval
    let count = 0;
    const interval = setInterval(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        setCapturedImages(prev => {
          const updated = [...prev, imageSrc];
          if (updated.length >= 5) {
            clearInterval(interval);
            setMode('review');
            toast.success('Captured 5 images. Ready to process.');
          }
          return updated;
        });
        count++;
      }
    }, 500);
  };

  const processImagesLocally = async () => {
    setIsProcessing(true);
    try {
      // Step 1: Send to our own FREE backend endpoint
      const formData = new FormData();
      
      // Convert base64 to blob for each image
      for (const base64 of capturedImages) {
        const res = await fetch(base64);
        const blob = await res.blob();
        formData.append('images', blob, `product-${Date.now()}.jpg`);
      }

      const response = await fetch('/api/ai/scan-product-free', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Processing failed');
      
      const data = await response.json();
      onScanComplete(capturedImages, data.extractedText);
      
    } catch (error) {
      toast.error('Scan failed. Please try again or enter manually.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {mode === 'preview' && (
        <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
          <Webcam 
            ref={webcamRef} 
            screenshotFormat="image/jpeg" 
            className="h-full w-full object-cover"
            videoConstraints={{
              facingMode: 'environment',
              width: 1080,
              height: 1080
            }}
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button size="lg" onClick={startCapture} className="shadow-xl">
              <Camera className="mr-2 h-5 w-5" /> Start Auto-Capture
            </Button>
          </div>
        </div>
      )}

      {mode === 'capturing' && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 font-medium">Capturing 5 images... Hold steady</p>
          <p className="text-sm text-muted-foreground">{capturedImages.length}/5</p>
        </div>
      )}

      {mode === 'review' && (
        <div className="space-y-4">
          <h3 className="font-medium">Review Captured Images</h3>
          <div className="grid grid-cols-3 gap-2">
            {capturedImages.map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                <Image src={img} alt={`Captured ${i+1}`} fill className="object-cover" />
                <button 
                  onClick={() => {
                    setCapturedImages(prev => prev.filter((_, idx) => idx !== i));
                    if (capturedImages.length === 1) setMode('preview');
                  }}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {capturedImages.length < 5 && (
              <button 
                onClick={() => setMode('preview')}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary"
              >
                <RefreshCw className="h-6 w-6" />
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setMode('preview')}>
              Retake
            </Button>
            <Button 
              onClick={processImagesLocally} 
              disabled={isProcessing || capturedImages.length === 0}
              className="flex-1"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Process & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
