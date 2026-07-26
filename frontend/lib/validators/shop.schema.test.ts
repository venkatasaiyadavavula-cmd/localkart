import { shopOnboardingSchema, normalizeIndianMobileInput } from './shop.schema';

describe('normalizeIndianMobileInput', () => {
  it('strips +91 prefix', () => {
    expect(normalizeIndianMobileInput('+919876543210')).toBe('9876543210');
  });
});

describe('shopOnboardingSchema contactPhone', () => {
  it('accepts 10 digits', () => {
    const r = shopOnboardingSchema.safeParse({
      name: 'Test Shop',
      address: '123 Main Street',
      city: 'Kadapa',
      state: 'Andhra Pradesh',
      pincode: '516001',
      contactPhone: '9876543210',
    });
    expect(r.success).toBe(true);
  });

  it('accepts +91 prefixed numbers', () => {
    const r = shopOnboardingSchema.safeParse({
      name: 'Test Shop',
      address: '123 Main Street',
      city: 'Kadapa',
      state: 'Andhra Pradesh',
      pincode: '516001',
      contactPhone: '+91 98765 43210',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.contactPhone).toBe('9876543210');
    }
  });
});
