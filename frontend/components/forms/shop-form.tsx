'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationPicker } from '@/components/map/location-picker';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required').max(150),
  description: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required').default('Kadapa'),
  state: z.string().min(1, 'State is required').default('Andhra Pradesh'),
  pincode: z.string().min(6, 'Valid pincode required'),
  contactPhone: z.string().min(10, 'Valid phone required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  deliveryCharge: z.coerce.number().min(0).default(0),
  freeDeliveryAbove: z.coerce.number().min(0).default(0),
  fssaiLicense: z.string().optional(),
  gstNumber: z.string().optional(),
});

export type ShopFormData = z.infer<typeof shopSchema>;

interface ShopFormProps {
  initialData?: Partial<ShopFormData>;
  initialLocation?: { lat: number; lng: number };
  onSubmit: (data: ShopFormData, location: { lat: number; lng: number }) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ShopForm({
  initialData = {},
  initialLocation,
  onSubmit,
  isLoading,
  submitLabel = 'Save Shop',
}: ShopFormProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState(initialLocation || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      city: 'Kadapa',
      state: 'Andhra Pradesh',
      deliveryCharge: 0,
      freeDeliveryAbove: 0,
      ...initialData,
    },
  });

  const handleFormSubmit = (data: ShopFormData) => {
    if (!location) {
      toast.error('Please select your shop location on the map');
      return;
    }
    onSubmit(data, location);
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shop Information</CardTitle>
            <CardDescription>Basic details about your shop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Sri Venkateswara Kirana" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="contactPhone" className="pl-10" {...register('contactPhone')} />
                </div>
                {errors.contactPhone && (
                  <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="contactEmail" type="email" className="pl-10" {...register('contactEmail')} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Textarea id="address" {...register('address')} rows={2} />
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
              {!location && (
                <p className="text-xs text-destructive">Please select your shop location</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deliveryCharge">Delivery Charge (₹)</Label>
                <Input id="deliveryCharge" type="number" {...register('deliveryCharge')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeDeliveryAbove">Free Delivery Above (₹)</Label>
                <Input id="freeDeliveryAbove" type="number" {...register('freeDeliveryAbove')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input id="openingTime" type="time" {...register('openingTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input id="closingTime" type="time" {...register('closingTime')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fssaiLicense">FSSAI License</Label>
              <Input id="fssaiLicense" {...register('fssaiLicense')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input id="gstNumber" {...register('gstNumber')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>

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
    </>
  );
}
