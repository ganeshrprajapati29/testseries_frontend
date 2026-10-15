import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loader({ label = 'Loading...', className, fullScreen }: { label?: string; className?: string; fullScreen?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center justify-center gap-3 py-16 text-slate-500', fullScreen && 'min-h-[70vh]', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
