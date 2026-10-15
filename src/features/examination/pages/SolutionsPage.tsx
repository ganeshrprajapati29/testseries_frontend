import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resultUrl } from '@/app/constants';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { Loader } from '@/components/common/Loader';
import { QuestionReview } from '@/components/tests/QuestionReview';
import { formatScore } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Language, SolutionQuestion } from '@/types';
import { examinationApi } from '../examination.api';

type Filter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'marked';

const FILTERS: { key: Filter; label: string; test: (q: SolutionQuestion) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'correct', label: 'Correct', test: (q) => q.isCorrect },
  { key: 'incorrect', label: 'Incorrect', test: (q) => q.isAttempted && !q.isCorrect },
  { key: 'unanswered', label: 'Unanswered', test: (q) => !q.isAttempted },
  { key: 'marked', label: 'Marked', test: (q) => q.markedForReview },
];

export default function SolutionsPage() {
  const { attemptId = '' } = useParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [lang, setLang] = useState<Language | null>(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'solutions', attemptId], queryFn: () => examinationApi.solutions(attemptId) });

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, data?.questions.filter(f.test).length ?? 0])), [data]);

  if (isLoading) return <Loader fullScreen />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Solutions not available" />
      </div>
    );

  const language = lang ?? data.language;
  const visible = data.questions.filter(FILTERS.find((f) => f.key === filter)!.test);

  return (
    <div className="container-page max-w-5xl py-8">
      <Link to={resultUrl(attemptId)} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to result
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solutions</h1>
          <p className="text-sm text-slate-500">
            {data.testTitle} • Score {formatScore(data.totalScore)} / {formatScore(data.maximumMarks)}
          </p>
        </div>
        <LanguageSelector value={language} options={data.languageOptions} onChange={setLang} />
      </div>

      <div className="sticky top-16 z-10 -mx-4 mb-6 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold', filter === f.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.questions.map((q) => (
            <a
              key={q.number}
              href={`#solution-${q.number}`}
              onClick={() => setFilter('all')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded text-xs font-semibold',
                q.isCorrect ? 'bg-emerald-500 text-white' : q.isAttempted ? 'bg-red-500 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300',
              )}
              aria-label={`Go to question ${q.number}`}
            >
              {q.number}
            </a>
          ))}
        </div>
      </div>

      {visible.length ? (
        <div className="space-y-5">
          {visible.map((q) => (
            <QuestionReview key={q.number} q={q} language={language} />
          ))}
        </div>
      ) : (
        <EmptyState title="No questions in this filter" />
      )}
    </div>
  );
}
