import { Languages } from 'lucide-react';
import type { Language } from '@/types';
import { cn } from '@/lib/utils';

const LABELS: Record<Language, string> = { en: 'English', hi: 'हिन्दी' };

export function LanguageSelector({ value, options, onChange, className }: { value: Language; options: Language[]; onChange: (lang: Language) => void; className?: string }) {
  if (options.length < 2) return null;
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5', className)} role="group" aria-label="Question language">
      <Languages className="mx-1 h-4 w-4 text-slate-400" aria-hidden />
      {options.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          aria-pressed={value === lang}
          className={cn('rounded-md px-2.5 py-1 text-xs font-semibold transition', value === lang ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
