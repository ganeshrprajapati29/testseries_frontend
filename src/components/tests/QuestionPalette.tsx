import { countStatuses, PALETTE_LABELS, PALETTE_STYLES, paletteStatus } from '@/features/examination/examination.utils';
import type { PaletteStatus } from '@/features/examination/examination.types';
import { cn } from '@/lib/utils';
import type { AnswerState } from '@/types';

interface QuestionPaletteProps {
  questionIds: string[];
  answers: Record<string, AnswerState>;
  current: number;
  onJump: (index: number) => void;
}

const ORDER: PaletteStatus[] = ['answered', 'not-answered', 'not-visited', 'marked', 'answered-marked'];

export function QuestionPalette({ questionIds, answers, current, onJump }: QuestionPaletteProps) {
  const counts = countStatuses(answers, questionIds);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3 text-xs">
        {ORDER.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold', PALETTE_STYLES[s])}>{counts[s]}</span>
            <span className="text-slate-600">{PALETTE_LABELS[s]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-7 lg:grid-cols-5 xl:grid-cols-6" role="list" aria-label="Question palette">
        {questionIds.map((id, i) => {
          const status = paletteStatus(answers[id]);
          return (
            <button
              key={id}
              type="button"
              role="listitem"
              onClick={() => onJump(i)}
              aria-label={`Question ${i + 1}, ${PALETTE_LABELS[status]}`}
              aria-current={i === current ? 'step' : undefined}
              className={cn('h-9 rounded-md border text-sm font-semibold transition', PALETTE_STYLES[status], i === current && 'outline-2 outline-offset-2 outline-brand-600')}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
