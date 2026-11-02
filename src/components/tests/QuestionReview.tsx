import { CheckCircle2, Clock, Lightbulb, MinusCircle, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatDuration, formatScore } from '@/lib/formatters';
import { cn, OPTION_LABELS } from '@/lib/utils';
import type { Language, SolutionQuestion } from '@/types';
import { Badge } from '../common/Badge';
import { ImageGallery } from '../common/ImageGallery';

export function QuestionReview({ q, language, actions, footer }: { q: SolutionQuestion; language: Language; actions?: ReactNode; footer?: ReactNode }) {
  const t = q.translations.find((tr) => tr.language === language);
  const questionText = t?.questionText || q.questionText;
  const explanation = t?.explanation || q.explanation;
  const optionText = (key: string) => t?.options.find((o) => o.key === key)?.text || q.options.find((o) => o.key === key)?.text || '';

  const status = q.isCorrect
    ? { label: 'Correct', tone: 'green' as const, icon: CheckCircle2 }
    : q.isAttempted
      ? { label: 'Incorrect', tone: 'red' as const, icon: XCircle }
      : { label: 'Not answered', tone: 'gray' as const, icon: MinusCircle };
  const StatusIcon = status.icon;

  return (
    <article className="card p-5" lang={language} id={`solution-${q.number}`}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">Question {q.number}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>
            <StatusIcon className="h-3 w-3" /> {status.label}
          </Badge>
          <Badge tone={q.marksAwarded > 0 ? 'green' : q.marksAwarded < 0 ? 'red' : 'gray'}>
            {q.marksAwarded > 0 ? '+' : ''}
            {formatScore(q.marksAwarded)} marks
          </Badge>
          {q.timeSpentSeconds > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" /> {formatDuration(q.timeSpentSeconds)}
            </span>
          )}
          {actions}
        </div>
      </header>
      <p className="prose-text">{questionText}</p>
      <ImageGallery images={q.images?.length ? q.images : [q.imageUrl]} className="mt-3 max-w-2xl" />
      <ul className="mt-4 space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = opt.key === q.correctOption;
          const isChosen = opt.key === q.selectedOption;
          return (
            <li
              key={opt.key}
              className={cn(
                'flex items-start gap-3 rounded-lg border-2 p-3 text-sm',
                isCorrect ? 'border-emerald-500 bg-emerald-50' : isChosen ? 'border-red-400 bg-red-50' : 'border-slate-200',
              )}
            >
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', isCorrect ? 'bg-emerald-600 text-white' : isChosen ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600')}>
                {OPTION_LABELS[i]}
              </span>
              <span className="prose-text flex-1">
                {optionText(opt.key)}
                {opt.imageUrl && <img src={opt.imageUrl} alt="" className="mt-2 max-h-32 rounded border" />}
              </span>
              {isCorrect && <span className="text-xs font-semibold text-emerald-700">Correct answer</span>}
              {isChosen && !isCorrect && <span className="text-xs font-semibold text-red-600">Your answer</span>}
              {isChosen && isCorrect && <span className="text-xs font-semibold text-emerald-700">Your answer</span>}
            </li>
          );
        })}
      </ul>
      {explanation && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <Lightbulb className="h-4 w-4" /> Explanation
          </p>
          <p className="prose-text text-sm text-slate-700">{explanation}</p>
          <ImageGallery images={q.explanationImages ?? []} className="mt-3 max-w-2xl" compact />
        </div>
      )}
      {!explanation && (q.explanationImages?.length ?? 0) > 0 && <ImageGallery images={q.explanationImages} className="mt-4 max-w-2xl" compact />}
      {footer}
    </article>
  );
}
