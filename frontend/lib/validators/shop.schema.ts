import { z } from 'zod';

/** Normalize Indian mobile input to 10 digits (strips +91 / leading 0). */
export function normalizeIndianMobileInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(-10);
  return digits;
}

const tenDigitPhone = z.preprocess(
  normalizeIndianMobileInput,
  z.string().regex(/^\d{10}$/, 'Enter a 10-digit mobile number (without +91)'),
);

export const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required').max(150),
  description: z.string().max(1000).optional(),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').default('Kadapa'),
  state: z.string().min(1, 'State is required').default('Andhra Pradesh'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode required'),
  contactPhone: tenDigitPhone,
  contactEmail: z.string().email().optional().or(z.literal('')),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  deliveryCharge: z.coerce.number().min(0).default(0),
  freeDeliveryAbove: z.coerce.number().min(0).default(0),
  fssaiLicense: z.string().optional(),
  gstNumber: z.string().regex(/^[0-9A-Z]{15}$/, 'Invalid GST number').optional(),
  panCard: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number').optional(),
});

/** Seller onboarding — shop fields without hours/delivery tuning. */
export const shopOnboardingSchema = shopSchema.omit({
  openingTime: true,
  closingTime: true,
  deliveryCharge: true,
  freeDeliveryAbove: true,
}).extend({
  gstNumber: z.string().optional(),
  panCard: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number').optional().or(z.literal('')),
  fssaiDocumentUrl: z.string().url().optional().or(z.literal('')),
  gstDocumentUrl: z.string().url().optional().or(z.literal('')),
  panDocumentUrl: z.string().url().optional().or(z.literal('')),
  shopPhotoUrl: z.string().url().optional().or(z.literal('')),
});

export type ShopFormValues = z.infer<typeof shopSchema>;
export type ShopOnboardingFormValues = z.infer<typeof shopOnboardingSchema>;
