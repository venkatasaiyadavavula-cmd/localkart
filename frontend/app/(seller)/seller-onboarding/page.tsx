'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Upload, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateShop } from '@/hooks/use-create-shop';
import { LocationPicker } from '@/components/map/location-picker';
import { Progress } from '@/components/ui/progress';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required').max(150),
  description: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required').default('Kadapa'),
  state: z.string().min(1, 'State is required').default('Andhra Pradesh'),
  pincode: z.string().min(6, 'Valid pincode required'),
  contactPhone: z.string().min(10, 'Valid phone required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  fssaiLicense: z.string().optional(),
  gstNumber: z.string().optional(),
});

type ShopFormData = z.infer<typeof shopSchema>;

const steps = ['Shop Details', 'Address', 'Documents', 'Review'];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { createShop, isLoading } = useCreateShop();
  const [currentStep, setCurrentStep] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      city: 'Kadapa',
      state: 'Andhra Pradesh',
    },
  });

  const watchAddress = watch();

  const handleNext = async () => {
    let fieldsToValidate: (keyof ShopFormData)[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ['name', 'contactPhone'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['address', 'city', 'state', 'pincode'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: ShopFormData) => {
    if (!location) {
      toast.error('Please select your shop location on the map');
      return;
    }

    try {
      await createShop({
        ...data,
        latitude: location.lat,
        longitude: location.lng,
      });
      toast.success('Shop registered successfully! Awaiting approval.');
      router.push('/seller/dashboard');
    } catch (error) {
      toast.error('Failed to register shop');
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="container flex min-h-screen items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="font-heading text-3xl font-bold">Set Up Your Shop</h1>
          <p className="mt-2 text-muted-foreground">
            Join LocalKart and start selling to customers in Kadapa
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            {steps.map((step, index) => (
              <span key={step} className={index <= currentStep ? 'text-primary' : ''}>
                {step}
              </span>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 0: Shop Details */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Shop Name *</Label>
                    <Input id="name" placeholder="e.g., Sri Venkateswara Kirana" {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell customers about your shop..."
                      rows={3}
                      {...register('description')}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="contactPhone" className="pl-10" {...register('contactPhone')} />
                      </div>
                      {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="contactEmail" type="email" className="pl-10" {...register('contactEmail')} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Address */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Textarea id="address" rows={2} {...register('address')} />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register('city')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...register('state')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input id="pincode" {...register('pincode')} />
                      {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shop Location on Map *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowLocationPicker(true)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {location ? 'Location Selected ✓' : 'Pin Your Shop Location'}
                    </Button>
                    {!location && currentStep === 3 && (
                      <p className="text-xs text-destructive">Please select your shop location</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Documents */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fssaiLicense">FSSAI License (Optional)</Label>
                    <Input id="fssaiLicense" {...register('fssaiLicense')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                    <Input id="gstNumber" {...register('gstNumber')} />
                  </div>

                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      You can add these documents later. They help build trust with customers.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">{watchAddress.name || 'Shop Name'}</h3>
                    <p className="text-sm text-muted-foreground">{watchAddress.contactPhone}</p>
                    <p className="mt-2 text-sm">
                      {watchAddress.address}, {watchAddress.city}, {watchAddress.state} - {watchAddress.pincode}
                    </p>
                    {location && (
                      <p className="mt-2 text-sm text-green-600">
                        <CheckCircle className="mr-1 inline h-4 w-4" /> Location verified
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By submitting, you agree to LocalKart's Seller Terms and Conditions.
                  </p>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-6 flex justify-between">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button type="button" className="ml-auto" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit for Approval
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Picker Dialog */}
      {showLocationPicker && (
        <LocationPicker
          open={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSelect={(lat, lng) => {
            setLocation({ lat, lng });
            setShowLocationPicker(false);
          }}
          defaultLocation={location || { lat: 14.4673, lng: 78.8242 }}
        />
      )}
    </div>
  );
}
