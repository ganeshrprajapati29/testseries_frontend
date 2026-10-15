import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorMessage } from '@/services/apiClient';
import { Button } from './Button';

export function ErrorState({ error, onRetry, title = 'Could not load this page' }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 px-6 py-12 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-red-500" aria-hidden />
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
}
