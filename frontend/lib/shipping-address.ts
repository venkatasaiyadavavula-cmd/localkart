import type { CreateOrderData } from '@/lib/api/orders';

/** Checkout form fields — includes UI-only keys that must not be sent to POST /orders */
export interface CheckoutAddressForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  type?: 'home' | 'work' | 'other';
  saveAddress?: boolean;
}

/** Build API-safe shippingAddress (backend ShippingAddressDto whitelist only). */
export function toShippingAddressPayload(
  data: CheckoutAddressForm,
  coords?: { latitude?: number; longitude?: number },
): CreateOrderData['shippingAddress'] {
  const phone = data.phone.startsWith('+')
    ? data.phone
    : `+91${data.phone.replace(/\D/g, '').slice(-10)}`;

  const payload: CreateOrderData['shippingAddress'] = {
    name: data.name,
    phone,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
  };

  if (coords?.latitude != null) payload.latitude = coords.latitude;
  if (coords?.longitude != null) payload.longitude = coords.longitude;

  return payload;
}
