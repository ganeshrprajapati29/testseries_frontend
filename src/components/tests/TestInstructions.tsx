import { CheckCircle2, Clock, FileQuestion, MinusCircle, PlusCircle, RotateCcw } from 'lucide-react';
import { PALETTE_LABELS, PALETTE_STYLES } from '@/features/examination/examination.utils';
import type { PaletteStatus } from '@/features/examination/examination.types';
import { formatDuration, formatScore } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { TestDetail } from '@/types';

export function TestInstructions({ test, generalInstructions }: { test: TestDetail; generalInstructions?: string }) {
  const facts = [
    { icon: FileQuestion, label: 'Questions', value: test.questionCount },
    { icon: Clock, label: 'Duration', value: formatDuration(test.durationSeconds) },
    { icon: CheckCircle2, label: 'Maximum marks', value: formatScore(test.totalMarks) },
    { icon: PlusCircle, label: 'Marks per correct', value: `+${formatScore(test.marksPerCorrect)}` },
    { icon: MinusCircle, label: 'Negative marking', value: test.negativeMarks > 0 ? `-${formatScore(test.negativeMarks)}` : 'None' },
    { icon: RotateCcw, label: 'Attempts allowed', value: test.maxAttempts === 0 ? 'Unlimited' : test.maxAttempts },
  ];
  const general = (generalInstructions ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  const legend: PaletteStatus[] = ['not-visited', 'not-answered', 'answered', 'marked', 'answered-marked'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Icon className="mb-1 h-4 w-4 text-brand-600" aria-hidden />
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {test.instructions && (
        <div>
          <h3 className="mb-2 font-semibold">Test-specific instructions</h3>
          <p className="prose-text rounded-lg bg-brand-50/60 p-4 text-sm">{test.instructions}</p>
        </div>
      )}

      {general.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">General instructions</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            {general.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold">Question palette</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {legend.map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm">
              <span className={cn('h-6 w-6 rounded-md border', PALETTE_STYLES[s])} aria-hidden />
              {PALETTE_LABELS[s]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
