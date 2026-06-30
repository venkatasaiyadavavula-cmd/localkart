import { z } from 'zod';

export const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required').max(150),
  description: z.string().max(1000).optional(),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').default('Kadapa'),
  state: z.string().min(1, 'State is required').default('Andhra Pradesh'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode required'),
  contactPhone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  deliveryCharge: z.coerce.number().min(0).default(0),
  freeDeliveryAbove: z.coerce.number().min(0).default(0),
  fssaiLicense: z.string().optional(),
  gstNumber: z.string().regex(/^[0-9A-Z]{15}$/, 'Invalid GST number').optional(),
  panCard: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number').optional(),
});

export type ShopFormValues = z.infer<typeof shopSchema>;
