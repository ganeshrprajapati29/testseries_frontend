import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { formatDuration, formatScore } from '@/lib/formatters';
import { cn, OPTION_LABELS } from '@/lib/utils';
import { adminApi } from '../admin.api';

export function TestPreview({ open, onClose, testId }: { open: boolean; onClose: () => void; testId: string }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'test-preview', testId], queryFn: () => adminApi.previewTest(testId), enabled: open });
  return (
    <Modal open={open} onClose={onClose} size="full" title={data ? `Preview: ${data.title}` : 'Preview'} description={data ? `${data.questions.length} questions • ${formatScore(data.totalMarks)} marks • ${formatDuration(data.durationSeconds)} • -${formatScore(data.negativeMarks)} per wrong` : undefined}>
      {isLoading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <ol className="space-y-5">
          {data.questions.map((q, i) => (
            <li key={q._id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500">Q{i + 1} • {q.subject || 'General'} • {q.difficulty}</p>
              <p className="prose-text mt-1">{q.questionText}</p>
              {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-2 max-h-56 rounded border" />}
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <li key={o.key} className={cn('rounded-md border px-3 py-2 text-sm', o.key === q.correctOption ? 'border-emerald-500 bg-emerald-50 font-medium' : 'border-slate-200')}>
                    <b>{OPTION_LABELS[oi]}.</b> {o.text}
                  </li>
                ))}
              </ul>
              {q.explanation && <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-slate-700">{q.explanation}</p>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
