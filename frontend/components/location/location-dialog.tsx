'use client';

import { useState, useEffect } from 'react';
import { MapPin, MapPinOff, AlertTriangle, Loader2, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { forwardGeocodePincode, reverseGeocode } from '@/lib/geocode';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useLocationStore, MAX_DELIVERY_RADIUS_KM } from '@/lib/store/location-store';
import { getDeliveryPricingSummary } from '@/lib/delivery-pricing';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

type LocationStep = 'detect' | 'manual' | 'checking' | 'result' | 'blocked';

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
}: LocationDialogProps) {
  const { loading, error, detectLocation } = useGeolocation();
  const {
    setLocation,
    setPermissionStatus,
    permissionStatus,
    validateAndSetServiceability,
    isServiceable,
    nearestShopDistance,
    deliveryCharge,
  } = useLocationStore();
  const [step, setStep] = useState<LocationStep>('detect');
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(permissionStatus === 'denied' ? 'blocked' : 'detect');
      setServiceError(null);
      setPincodeError(null);
    }
  }, [open, permissionStatus]);

  useEffect(() => {
    if (permissionStatus === 'denied') {
      setStep('blocked');
    }
  }, [permissionStatus]);

  const finishServiceabilityCheck = async (lat: number, lng: number) => {
    const serviceable = await validateAndSetServiceability(lat, lng);
    setStep('result');
    if (!serviceable) {
      setServiceError(`No shops deliver within ${MAX_DELIVERY_RADIUS_KM} km of your location.`);
    }
    return serviceable;
  };

  const handleDetectLocation = async () => {
    setStep('checking');
    setServiceError(null);
    try {
      const coords = await detectLocation();
      if (!coords) {
        setStep('detect');
        return;
      }

      // Persist coords immediately — do not wait for reverse geocode or serviceability
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: 'gps',
      });
      setPermissionStatus('granted');

      try {
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          source: 'gps',
          city: geo.city,
          state: geo.state,
          pincode: geo.pincode,
          address: geo.address,
        });
      } catch {
        // Coords already saved; geocode enrichment is optional
      }

      await finishServiceabilityCheck(coords.latitude, coords.longitude);
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to detect location';
      if (message.toLowerCase().includes('denied')) {
        setPermissionStatus('denied');
        setStep('blocked');
      } else {
        setStep('detect');
        toast.error('Failed to detect location. Please try again or enter your pincode.');
      }
    }
  };

  const handleManualPincode = async () => {
    const clean = pincode.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) {
      setPincodeError('Enter a valid 6-digit pincode');
      return;
    }

    setPincodeError(null);
    setStep('checking');

    const geo = await forwardGeocodePincode(clean);
    if (geo.latitude == null || geo.longitude == null) {
      setStep('manual');
      setPincodeError('Could not find that pincode. Try 516001 for Kadapa.');
      return;
    }

    setLocation({
      latitude: geo.latitude,
      longitude: geo.longitude,
      source: 'manual',
      city: geo.city,
      state: geo.state,
      pincode: clean,
      address: geo.address,
    });

    await finishServiceabilityCheck(geo.latitude, geo.longitude);
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
          Enable location in your browser settings, or enter your pincode below.
        </p>
      </DialogDescription>
      <div className="flex gap-3 mt-6 w-full max-w-xs flex-col">
        <Button onClick={() => setStep('manual')} className="w-full">
          Enter Pincode
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
          Reload App
        </Button>
      </div>
    </div>
  );

  const renderManualStep = () => (
    <div className="flex flex-col py-4">
      <div className="text-center mb-4">
        <div className="rounded-full bg-primary/10 p-4 mb-4 mx-auto w-fit">
          <MapPin className="h-10 w-10 text-primary" />
        </div>
        <DialogTitle className="text-xl">Enter your pincode</DialogTitle>
        <DialogDescription className="mt-2">
          We&apos;ll check which shops deliver to your area within {MAX_DELIVERY_RADIUS_KM} km.
        </DialogDescription>
      </div>
      <div className="space-y-3">
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 516001"
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
              setPincodeError(null);
            }}
            className="mt-1"
          />
          {pincodeError && <p className="text-sm text-destructive mt-1">{pincodeError}</p>}
        </div>
        <Button onClick={handleManualPincode} className="w-full" size="lg" disabled={pincode.length < 6}>
          Set Location
        </Button>
        <button
          type="button"
          onClick={() => setStep('detect')}
          className="w-full text-sm text-muted-foreground hover:text-primary underline underline-offset-2"
        >
          Use GPS instead
        </button>
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
        We&apos;ll check which shops can deliver to your location within <strong>{MAX_DELIVERY_RADIUS_KM} km</strong>.
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
        type="button"
        onClick={() => setStep('manual')}
        className="mt-3 text-sm text-muted-foreground hover:text-primary underline underline-offset-2"
      >
        Enter pincode manually
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
          <DialogTitle className="text-xl">Great! We deliver to you!</DialogTitle>
          <DialogDescription className="mt-2 space-y-2">
            <p>There are shops nearby that can deliver to your location.</p>
            {nearestShopDistance != null && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Distance to nearest shop: <strong>{nearestShopDistance.toFixed(1)} km</strong></span>
                </div>
                <div className="mt-2 text-xl font-bold text-primary">
                  {deliveryCharge === 0 ? 'Free Delivery' : `Delivery Charge: ${formatPrice(deliveryCharge ?? 0)}`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ({getDeliveryPricingSummary()})
                </p>
              </div>
            )}
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
            {serviceError && <p className="text-sm text-muted-foreground">{serviceError}</p>}
            <p className="text-sm text-muted-foreground">
              You can still browse products, but delivery may not be available.
            </p>
          </DialogDescription>
          <div className="flex gap-3 mt-6 w-full">
            <Button variant="outline" onClick={() => setStep('detect')} className="flex-1">
              Try Again
            </Button>
            <Button onClick={() => setStep('manual')} className="flex-1">
              Enter Pincode
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (step === 'blocked' || (step === 'result' && !isServiceable)) {
          return;
        }
        onOpenChange(val);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (step === 'blocked' || (step === 'result' && !isServiceable)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Location Verification</DialogTitle>
        </DialogHeader>
        {step === 'blocked' && renderBlockedState()}
        {step === 'detect' && renderDetectionStep()}
        {step === 'manual' && renderManualStep()}
        {step === 'checking' && renderCheckingStep()}
        {step === 'result' && renderResultStep()}
      </DialogContent>
    </Dialog>
  );
}
