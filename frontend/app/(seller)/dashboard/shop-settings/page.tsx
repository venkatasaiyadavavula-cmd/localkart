'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useShop } from '@/hooks/use-shop';
import { Skeleton } from '@/components/ui/skeleton';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required').max(150),
  description: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode required'),
  contactPhone: z.string().min(10, 'Valid phone required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  deliveryCharge: z.coerce.number().min(0).default(0),
  freeDeliveryAbove: z.coerce.number().min(0).default(0),
});

type ShopFormData = z.infer<typeof shopSchema>;

export default function ShopSettingsPage() {
  const { data: shop, isLoading, updateShop } = useShop();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
  });

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        description: shop.description || '',
        address: shop.address,
        city: shop.city,
        state: shop.state,
        pincode: shop.pincode,
        contactPhone: shop.contactPhone,
        contactEmail: shop.contactEmail || '',
        openingTime: shop.openingTime || '',
        closingTime: shop.closingTime || '',
        deliveryCharge: shop.deliveryCharge,
        freeDeliveryAbove: shop.freeDeliveryAbove,
      });
    }
  }, [shop, reset]);

  const onSubmit = async (data: ShopFormData) => {
    setIsUpdating(true);
    try {
      await updateShop(data);
      toast.success('Shop settings updated successfully');
    } catch (error) {
      toast.error('Failed to update shop settings');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Shop Settings</h1>
        <p className="text-muted-foreground">Manage your shop profile and preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shop Information</CardTitle>
                <CardDescription>Basic details about your shop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} rows={3} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone *</Label>
                    <Input id="contactPhone" {...register('contactPhone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" {...register('contactEmail')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Textarea id="address" {...register('address')} rows={2} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" {...register('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" {...register('state')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input id="pincode" {...register('pincode')} />
                  </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Shop Status</p>
                    <p className="text-sm text-muted-foreground">Temporarily close or open your shop</p>
                  </div>
                  <Switch checked={isOpen} onCheckedChange={setIsOpen} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Save Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={!isDirty || isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
