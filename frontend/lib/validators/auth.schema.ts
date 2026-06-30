import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'seller']).default('customer'),
});

export const otpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
