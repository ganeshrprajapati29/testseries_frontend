import { useQuery } from '@tanstack/react-query';
import { Languages } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { adminApi } from '@/features/admin/admin.api';
import { errorMessage } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';

/** Whether machine translation is configured on the server (cached for the session). */
export function useTranslationEnabled() {
  const q = useQuery({ queryKey: ['admin', 'translate-status'], queryFn: adminApi.translateStatus, staleTime: Infinity, retry: false });
  return q.data?.enabled ?? false;
}

/**
 * "Translate from English" button: sends the English texts in one request and hands back the Hindi
 * texts in the same order. Empty English texts come back empty.
 */
export function TranslateButton({ getTexts, onTranslated, label = 'Translate from English', size = 'sm' }: { getTexts: () => string[]; onTranslated: (hindi: string[]) => void; label?: string; size?: 'sm' | 'md' }) {
  const enabled = useTranslationEnabled();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const texts = getTexts();
    if (!texts.some((t) => t.trim())) return toast.info('Write the English text first, then translate.');
    setBusy(true);
    try {
      onTranslated(await adminApi.translate(texts));
      toast.success('Hindi filled in - please review before saving');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) return null;
  return (
    <Button type="button" size={size} variant="secondary" icon={<Languages className="h-4 w-4" />} loading={busy} onClick={run}>
      {label}
    </Button>
  );
}

/** Bordered "Hindi version" panel used by the test and series editors. */
export function HindiPanel({ children, actions, autoTranslate, onAutoTranslate }: { children: ReactNode; actions?: ReactNode; autoTranslate: boolean; onAutoTranslate: (v: boolean) => void }) {
  const enabled = useTranslationEnabled();
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Languages className="h-4 w-4 text-amber-600" /> Hindi version (हिंदी)
          </h3>
          <p className="text-xs text-slate-500">Shown to students who choose Hindi. Leave empty to auto-translate from English.</p>
        </div>
        {actions}
      </div>
      <div className="space-y-3">{children}</div>
      {enabled && (
        <label className={cn('mt-3 flex items-center gap-2 text-sm text-slate-700')}>
          <input type="checkbox" className="accent-brand-600" checked={autoTranslate} onChange={(e) => onAutoTranslate(e.target.checked)} />
          Auto-translate empty Hindi fields from English when saving
        </label>
      )}
    </div>
  );
}
