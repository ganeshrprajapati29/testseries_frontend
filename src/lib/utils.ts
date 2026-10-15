/** Joins class names, skipping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Only allow same-site relative redirects (prevents open redirects through ?from=). */
export function safeRedirect(target: string | null | undefined, fallback = '/dashboard'): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
