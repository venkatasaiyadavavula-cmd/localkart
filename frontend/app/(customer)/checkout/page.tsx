'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  MapPin,
  Home,
  Building,
  Phone,
  User,
  ChevronRight,
  Truck,
  CreditCard,
  Wallet,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ShopStatusBanner } from '@/components/shop/shop-status-banner';
import { useCartStore } from '@/store/cart-store';
import { useShop } from '@/hooks/use-shop';
import { useAuth } from '@/hooks/use-auth';
import { useLocationStore, useDeliveryCharge } from '@/store/location-store';
import { formatPrice } from '@/lib/utils';
import { ordersApi } from '@/lib/api/orders';
import { addressesApi } from '@/lib/api/addresses';
import { LocationPicker } from '@/components/map/location-picker';

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode required'),
  type: z.enum(['home', 'work', 'other']).optional(),
  saveAddress: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCartStore();
  const { location, setLocation, validateAndSetServiceability } = useLocationStore();
  const deliveryCharge = useDeliveryCharge();

  // Get shop details from first item
  const shopId = items[0]?.shopId;
  const { data: shopDetails } = useShop(shopId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Load saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];
      const addresses = await addressesApi.list();
      return addresses.map((addr) => ({
        ...addr,
        name: addr.label || user?.name || '',
        phone: user?.phone || '',
        address: addr.fullAddress || addr.address || '',
        city: addr.city || 'Kadapa',
        state: addr.state || 'Andhra Pradesh',
        pincode: addr.pincode || '',
        type: addr.type || 'home',
      }));
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      city: 'Kadapa',
      state: 'Andhra Pradesh',
      type: 'home',
      saveAddress: true,
    },
  });

  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
    }
  }, [items, router]);

  useEffect(() => {
    if (location) {
      setValue('city', 'Kadapa');
      setValue('state', 'Andhra Pradesh');
    }
  }, [location, setValue]);

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      if (data.saveAddress) {
        try {
          await addressesApi.create({
            type: data.type || 'home',
            label: data.name || 'Home',
            fullAddress: [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', '),
            pincode: data.pincode,
            latitude: location?.latitude,
            longitude: location?.longitude,
            isDefault: false,
          });
        } catch {
          // non-blocking — order can still proceed
        }
      }

      const order = await ordersApi.createOrder({
        shippingAddress: {
          ...data,
          phone: data.phone.startsWith('+') ? data.phone : `+91${data.phone.replace(/\D/g, '').slice(-10)}`,
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
        paymentMethod: 'cod',
        deliveryNotes,
      });

      await clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/track?id=${order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingFee = deliveryCharge ?? 0;
  const orderTotal = totalAmount + shippingFee;

  if (items.length === 0) {
    return null;
  }

  const shopClosed = shopDetails?.isCurrentlyOpen === false;

  return (
    <div className="container py-6 md:py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Cart</span>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Checkout</span>
      </div>

      {/* Shop Status Banner */}
      {shopDetails && (
        <div className="mb-6">
          <ShopStatusBanner
            isCurrentlyOpen={shopDetails.isCurrentlyOpen}
            statusMessage={shopDetails.statusMessage}
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Address & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Delivery Address</h2>
              </div>

              {/* Saved addresses quick-select */}
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Saved Addresses</p>
                  <div className="flex flex-col gap-2">
                    {savedAddresses.map((addr: any) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setValue('name',    addr.name    || user?.name || '');
                          setValue('phone',   addr.phone   || user?.phone || '');
                          setValue('address', addr.address || '');
                          setValue('city',    addr.city    || 'Kadapa');
                          setValue('state',   addr.state   || 'Andhra Pradesh');
                          setValue('pincode', addr.pincode || '');
                          setValue('type',    addr.type    || 'home');
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                        style={{ borderColor: '#E5E9F2' }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF0FE' }}>
                          {addr.type === 'work' ? <Building className="h-4 w-4 text-primary" /> : <Home className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 capitalize">{addr.type || 'Home'}</p>
                          <p className="text-xs text-gray-500 truncate">{addr.address}, {addr.city}</p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EEF0FE', color: '#3D5AF1' }}>Default</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 font-medium">or enter new address</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="pl-10"
                        {...register('name')}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        className="pl-10"
                        {...register('phone')}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="House/Flat No., Street, Landmark"
                    rows={2}
                    {...register('address')}
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register('city')} />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register('state')} />
                    {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" {...register('pincode')} />
                    {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address Type</Label>
                  <RadioGroup
                    defaultValue="home"
                    onValueChange={(value) => setValue('type', value as any)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="home" id="home" />
                      <Label htmlFor="home" className="cursor-pointer font-normal">
                        <Home className="mr-1 inline h-4 w-4" /> Home
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="work" id="work" />
                      <Label htmlFor="work" className="cursor-pointer font-normal">
                        <Building className="mr-1 inline h-4 w-4" /> Work
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLocationPicker(true)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {location ? 'Update Location on Map' : 'Pin Location on Map'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Delivery Notes */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Delivery Notes (Optional)</h2>
              </div>
              <Textarea
                placeholder="Any special instructions for delivery..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Payment Method</h2>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/30">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Cash on Delivery (COD)</p>
                  <p className="text-sm text-muted-foreground">Pay with cash when you receive your order</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold">Order Summary</h2>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>

              <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 text-sm">
                    <span className="w-6 text-muted-foreground">{item.quantity}x</span>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                    {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-heading text-xl text-primary">{formatPrice(orderTotal)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-lg bg-primary/5 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Secure & encrypted checkout</span>
                </div>
              </div>

              <Button
                form="checkout-form"
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={isSubmitting || shopClosed}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : shopClosed ? (
                  'Shop is Currently Closed'
                ) : (
                  'Place COD Order'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Location Picker Dialog */}
      {showLocationPicker && (
        <LocationPicker
          open={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSelect={(lat, lng, address) => {
            setValue('address', address || '');
            setLocation({
              latitude: lat,
              longitude: lng,
              address,
              source: 'manual',
            });
            validateAndSetServiceability(lat, lng);
            setShowLocationPicker(false);
          }}
        />
      )}
    </div>
  );
}
