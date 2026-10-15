import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '@/types';
import { cn } from '@/lib/utils';

function pageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

export function Pagination({ meta, onPageChange, className }: { meta?: PageMeta; onPageChange: (page: number) => void; className?: string }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const btn = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition';

  return (
    <nav aria-label="Pagination" className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>-<span className="font-medium text-slate-700">{to}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={cn(btn, 'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40')} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(btn, p === page ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={cn(btn, 'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40')} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
