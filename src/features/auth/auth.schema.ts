import { z } from 'zod';

// Mirrors the server rules so users get instant feedback; the server validates again.
export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const emailRule = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: emailRule,
    mobile: z
      .string()
      .trim()
      .refine((v) => v === '' || /^(\+91[-\s]?)?[6-9]\d{9}$/.test(v), 'Enter a valid 10 digit mobile number'),
    password: passwordRule,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'Please accept the terms to continue' }),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const forgotPasswordSchema = z.object({ email: emailRule });

export const resetPasswordSchema = z
  .object({ password: passwordRule, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  mobile: z
    .string()
    .trim()
    .refine((v) => v === '' || /^(\+91[-\s]?)?[6-9]\d{9}$/.test(v), 'Enter a valid 10 digit mobile number'),
  preferredLanguage: z.enum(['en', 'hi']),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
