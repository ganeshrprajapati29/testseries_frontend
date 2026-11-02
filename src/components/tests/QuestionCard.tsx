import { localize } from '@/features/examination/examination.utils';
import { cn, OPTION_LABELS } from '@/lib/utils';
import { ImageGallery } from '../common/ImageGallery';
import type { ExamQuestion, Language, OptionKey } from '@/types';

interface QuestionCardProps {
  question: ExamQuestion;
  number: number;
  total: number;
  language: Language;
  selected: OptionKey | null;
  onSelect: (key: OptionKey) => void;
  marksPerCorrect: number;
  negativeMarks: number;
  disabled?: boolean;
}

export function QuestionCard({ question, number, total, language, selected, onSelect, marksPerCorrect, negativeMarks, disabled }: QuestionCardProps) {
  const text = localize(question, language);
  return (
    <section aria-labelledby={`q-${question.id}`} lang={language}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h2 id={`q-${question.id}`} className="text-base font-bold text-slate-900">
          Question {number} <span className="font-normal text-slate-400">of {total}</span>
        </h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">+{marksPerCorrect}</span>
          {negativeMarks > 0 && <span className="rounded bg-red-50 px-2 py-0.5 text-red-700">-{negativeMarks}</span>}
        </div>
      </div>
      <p className="prose-text text-[15px] sm:text-base">{text.questionText}</p>
      <ImageGallery images={question.images?.length ? question.images : [question.imageUrl]} className="mt-4 max-w-2xl" />

      <div className="mt-6 space-y-3" role="radiogroup" aria-label={`Options for question ${number}`}>
        {question.options.map((opt, index) => {
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(opt.key)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition',
                isSelected ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50',
                disabled && 'cursor-not-allowed opacity-70',
              )}
            >
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold', isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-500')}>
                {OPTION_LABELS[index]}
              </span>
              <span className="flex-1 pt-0.5">
                <span className="prose-text text-sm sm:text-[15px]">{text.optionText(opt.key)}</span>
                {opt.imageUrl && <img src={opt.imageUrl} alt={`Option ${OPTION_LABELS[index]}`} loading="lazy" className="mt-2 max-h-40 rounded border border-slate-200 bg-white" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
