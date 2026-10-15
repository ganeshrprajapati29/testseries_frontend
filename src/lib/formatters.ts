const IST = 'Asia/Kolkata';

export function formatDate(value?: string | Date | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: IST });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: IST });
}

/** 3725 -> "1h 2m 5s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return sec ? `${m}m ${sec}s` : `${m} min`;
  return `${sec}s`;
}

/** 3725 -> "01:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatCurrency(amount: number, inPaise = false): string {
  const value = inPaise ? amount / 100 : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatScore(n?: number | null): string {
  if (n === undefined || n === null) return '-';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${formatNumber(n)} ${n === 1 ? word : plural}`;
}

export const TEST_TYPE_LABELS: Record<string, string> = {
  FULL_LENGTH: 'Full Test',
  SECTIONAL: 'Sectional',
  CHAPTER: 'Chapter Test',
  MINI: 'Mini Test',
  PYQ_PAPER: 'Previous Year Paper',
};

export const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  AUTO_SUBMITTED: 'Auto-submitted',
  EVALUATED: 'Evaluated',
};
