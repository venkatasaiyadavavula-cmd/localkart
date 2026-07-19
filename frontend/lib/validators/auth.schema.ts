import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/** Login form with optional remember-me checkbox. */
export const loginFormSchema = loginSchema.extend({
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'seller']).default('customer'),
});

/** Register form with password confirmation (UI pages). */
export const registerWithConfirmSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type LoginFormWithRememberValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type RegisterWithConfirmFormValues = z.infer<typeof registerWithConfirmSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
