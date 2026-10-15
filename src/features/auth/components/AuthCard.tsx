import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { logoUrl, settings } = useSettings();
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block">
            <img src={logoUrl} alt="Civil Sansad" className="mx-auto h-20 w-20 object-contain" />
          </Link>
          <p className="mt-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">{settings?.tagline || 'Achieving Excellence Together'}</p>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}

export function FormAlert({ message, tone = 'error' }: { message?: string | null; tone?: 'error' | 'success' }) {
  if (!message) return null;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={tone === 'error' ? 'mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700' : 'mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'}>
      {message}
    </div>
  );
}
