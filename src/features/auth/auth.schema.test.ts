import { describe, expect, it } from 'vitest';
import { registerSchema, resetPasswordSchema } from './auth.schema';
import { safeRedirect } from '@/lib/utils';
import { formatClock, formatScore } from '@/lib/formatters';

describe('auth schemas', () => {
  const valid = { name: 'Asha Verma', email: 'asha@example.com', mobile: '', password: 'Passw0rd1', confirmPassword: 'Passw0rd1', acceptTerms: true as const };

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects weak passwords, mismatches and bad mobile numbers', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'password', confirmPassword: 'password' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, mobile: '12345' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, mobile: '9876543210' }).success).toBe(true);
  });

  it('requires matching reset passwords', () => {
    expect(resetPasswordSchema.safeParse({ password: 'NewPass123', confirmPassword: 'NewPass123' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: 'NewPass123', confirmPassword: 'NewPass124' }).success).toBe(false);
  });
});

describe('helpers', () => {
  it('only allows same-site redirects', () => {
    expect(safeRedirect('/my-tests')).toBe('/my-tests');
    expect(safeRedirect('//evil.com')).toBe('/dashboard');
    expect(safeRedirect('https://evil.com')).toBe('/dashboard');
    expect(safeRedirect(null)).toBe('/dashboard');
  });

  it('formats exam clocks and scores', () => {
    expect(formatClock(3725)).toBe('01:02:05');
    expect(formatClock(65)).toBe('01:05');
    expect(formatScore(3.5)).toBe('3.50');
    expect(formatScore(4)).toBe('4');
  });
});
