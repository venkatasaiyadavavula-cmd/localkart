import { z } from 'zod';

export const shippingAddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode required'),
  type: z.enum(['home', 'work', 'other']).optional(),
  saveAddress: z.boolean().optional(),
});

export type ShippingAddressFormValues = z.infer<typeof shippingAddressSchema>;
