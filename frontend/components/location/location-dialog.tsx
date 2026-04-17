'use client';

import { useState, useEffect } from 'react';
import { MapPin, MapPinOff, AlertTriangle, Loader2, CheckCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useLocationStore, KADAPA_CENTER, MAX_DELIVERY_RADIUS_KM } from '@/lib/store/location-store';
import { toast } from 'sonner';

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetectLocation?: () => Promise<void>;
  locationLoading?: boolean;
  locationError?: string | null;
}

export function LocationDialog({
  open,
  onOpenChange,
  onDetectLocation,
  locationLoading = false,
  locationError = null,
}: LocationDialogProps) {
  const { latitude, longitude, loading, error, detectLocation } = useGeolocation();
  const { setLocation, setPermissionStatus, permissionStatus, validateAndSetServiceability, isServiceable } = useLocationStore();
  const [step, setStep] = useState<'detect' | 'checking' | 'result' | 'blocked'>('detect');
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('detect');
      setServiceError(null);
    }
  }, [open]);

  useEffect(() => {
    if (permissionStatus === 'denied') {
      setStep('blocked');
    }
  }, [permissionStatus]);

  const handleDetectLocation = async () => {
    setStep('checking');
    try {
      const coords = await detectLocation();
      if (coords) {
        // ముందుగా లొకేషన్ ని స్టోర్ చేయండి
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          source: 'gps',
          city: 'Kadapa',
          state: 'Andhra Pradesh',
        });
        setPermissionStatus('granted');

        // దగ్గరలో షాపులు ఉన్నాయో లేదో చెక్ చేయండి
        const serviceable = await validateAndSetServiceability(coords.latitude, coords.longitude);
        
        if (serviceable) {
          setStep('result');
        } else {
          setStep('result');
          setServiceError(`No shops deliver within ${MAX_DELIVERY_RADIUS_KM} km of your location.`);
        }
      }
    } catch (err) {
      console.error('Location detection failed:', err);
      setPermissionStatus('prompt');
      setStep('detect');
      toast.error('Failed to detect location. Please try again.');
    }
  };

  const handleManualAddress = () => {
    onOpenChange(false);
    toast.info('Please enter your complete address. We will check if any shops deliver to you.', {
      duration: 5000,
    });
    // మీరు ఇక్కడ మాన్యువల్ అడ్రస్ ఫారం ఓపెన్ చేయవచ్చు
  };

  const renderBlockedState = () => (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <MapPinOff className="h-10 w-10 text-destructive" />
      </div>
      <DialogTitle className="text-xl">Location Access Required</DialogTitle>
      <DialogDescription className="mt-2 space-y-3">
        <p>
          LocalKart needs your location to find shops that deliver to you.
        </p>
        <p className="text-sm text-muted-foreground">
          Please enable location permission in your browser settings and reload this page.
        </p>
      </DialogDescription>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload App
        </Button>
        <Button onClick={handleManualAddress} variant="secondary">
          Enter Address Manually
        </Button>
      </div>
    </div>
  );

  const renderDetectionStep = () => (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <MapPin className="h-10 w-10 text-primary" />
      </div>
      <DialogTitle className="text-xl">Find Shops Near You</DialogTitle>
      <DialogDescription className="mt-2">
        We'll check which shops can deliver to your location within <strong>{MAX_DELIVERY_RADIUS_KM} km</strong>.
      </DialogDescription>
      <Button
        onClick={handleDetectLocation}
        disabled={loading}
        className="mt-6 w-full max-w-xs"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Detecting...
          </>
        ) : (
          'Detect My Location'
        )}
      </Button>
      <button
        onClick={handleManualAddress}
        className="mt-3 text-sm text-muted-foreground hover:text-primary underline underline-offset-2"
      >
        Enter address manually
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );

  const renderCheckingStep = () => (
    <div className="flex flex-col items-center py-12 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <DialogTitle className="text-xl">Checking Nearby Shops</DialogTitle>
      <DialogDescription className="mt-2">
        Seeing which shops deliver within {MAX_DELIVERY_RADIUS_KM} km...
      </DialogDescription>
    </div>
  );

  const renderResultStep = () => (
    <div className="flex flex-col items-center py-6 text-center">
      {isServiceable ? (
        <>
          <div className="rounded-full bg-green-100 p-4 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Great! We deliver to you! 🎉</DialogTitle>
          <DialogDescription className="mt-2">
            There are shops nearby that can deliver to your location.
          </DialogDescription>
          <Button onClick={() => onOpenChange(false)} className="mt-6 w-full max-w-xs" size="lg">
            Continue Shopping
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-full bg-yellow-100 p-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
          </div>
          <DialogTitle className="text-xl">No Delivery Available</DialogTitle>
          <DialogDescription className="mt-2 space-y-3">
            <p>
              Sorry, there are no shops that deliver within <strong>{MAX_DELIVERY_RADIUS_KM} km</strong> of your location.
            </p>
            <p className="text-sm text-muted-foreground">
              We are expanding soon! You can still browse products, but delivery is not available.
            </p>
          </DialogDescription>
          <div className="flex gap-3 mt-6 w-full">
            <Button variant="outline" onClick={() => setStep('detect')} className="flex-1">
              Try Again
            </Button>
            <Button onClick={handleManualAddress} className="flex-1">
              Enter Manually
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // బ్లాక్ అయిన స్టేట్ లో యూజర్ డైలాగ్ క్లోజ్ చేయడానికి అనుమతించకూడదు
      if (step === 'blocked' || (step === 'result' && !isServiceable)) {
        return;
      }
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
        if (step === 'blocked' || (step === 'result' && !isServiceable)) {
          e.preventDefault();
        }
      }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Location Verification</DialogTitle>
        </DialogHeader>
        {step === 'blocked' && renderBlockedState()}
        {step === 'detect' && renderDetectionStep()}
        {step === 'checking' && renderCheckingStep()}
        {step === 'result' && renderResultStep()}
      </DialogContent>
    </Dialog>
  );
}
