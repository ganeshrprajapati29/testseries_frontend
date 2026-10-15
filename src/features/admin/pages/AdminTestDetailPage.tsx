import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Eye, FileSpreadsheet, Library, Pencil, Plus, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TestEditor } from '@/components/admin/TestEditor';
import { Badge } from '@/components/common/Badge';
import { Button, ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { formatDuration, formatScore } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';
import { adminApi } from '../admin.api';
import { QuestionPicker } from '../components/QuestionPicker';
import { TestPreview } from '../components/TestPreview';
import { useAdminMutation } from '../hooks/useAdminMutation';

export default function AdminTestDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<'questions' | 'settings'>('questions');
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; question?: Question | null }>({ open: false });
  const [order, setOrder] = useState<Question[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: test, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'test', id], queryFn: () => adminApi.test(id) });

  useEffect(() => {
    if (test?.questionIds) {
      setOrder(test.questionIds);
      setDirty(false);
    }
  }, [test]);

  const publish = useAdminMutation((status: string) => adminApi.testPublication(id, status), { success: (t) => `Test ${t.publicationStatus}` });
  const saveOrder = useAdminMutation(() => adminApi.setTestQuestions(id, order.map((q) => q._id)), { success: 'Question list saved', onSuccess: () => setDirty(false) });

  if (isLoading) return <Loader />;
  if (error || !test) return <ErrorState error={error} onRetry={() => refetch()} />;

  const isPyq = test.moduleType === 'PYQS';
  const backTo = isPyq ? '/admin/pyqs' : typeof test.seriesId === 'object' && test.seriesId ? `/admin/test-series/${test.seriesId._id}` : '/admin/tests';

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={test.publicationStatus} />
              {isPyq && <Badge tone="orange">PYQ {test.paperYear ?? ''}</Badge>}
              {test.isFree && <Badge tone="green">Free</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold">{test.title}</h1>
            <p className="text-sm text-slate-500">
              {typeof test.seriesId === 'object' && test.seriesId ? `${test.seriesId.title} • ` : ''}
              {typeof test.categoryId === 'object' ? test.categoryId.name : ''} • {order.length} questions • {formatScore(order.length * test.marksPerCorrect)} marks • {formatDuration(test.durationSeconds)} • {test.attemptCount ?? 0} attempts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<Eye className="h-4 w-4" />} onClick={() => setPreview(true)} disabled={!test.questionIds?.length}>
              Preview
            </Button>
            {test.publicationStatus === 'published' ? (
              <Button variant="outline" loading={publish.isPending} onClick={() => publish.mutate('unpublished')}>
                Unpublish
              </Button>
            ) : (
              <Button variant="success" loading={publish.isPending} onClick={() => publish.mutate('published')} disabled={dirty}>
                Publish
              </Button>
            )}
          </div>
        </div>
        {(test.attemptCount ?? 0) > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Students have already attempted this test. Changes apply to new attempts only - existing results keep the questions and marking they were taken with.
          </p>
        )}
      </div>

      <div className="inline-flex rounded-lg bg-white p-1 shadow-card">
        {(['questions', 'settings'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-md px-4 py-1.5 text-sm font-semibold capitalize', tab === t ? 'bg-brand-600 text-white' : 'text-slate-600')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <div className="card p-5">
          <TestEditor test={test} moduleType={test.moduleType} onSaved={() => refetch()} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button icon={<Library className="h-4 w-4" />} onClick={() => setPicker(true)}>
              Add from question bank
            </Button>
            <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => setEditor({ open: true, question: null })}>
              Write new question
            </Button>
            <ButtonLink to={`/admin/imports?testId=${test._id}`} variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />}>
              Import from Excel/CSV
            </ButtonLink>
            {dirty && (
              <Button variant="accent" className="ml-auto" icon={<Save className="h-4 w-4" />} loading={saveOrder.isPending} onClick={() => saveOrder.mutate(undefined)}>
                Save changes
              </Button>
            )}
          </div>
          {order.length ? (
            <ol className="card divide-y divide-slate-100">
              {order.map((q, i) => (
                <li key={q._id} className={cn('flex items-start gap-3 px-4 py-3', !q.isActive && 'bg-red-50')}>
                  <span className="mt-0.5 w-8 shrink-0 text-sm font-semibold text-slate-400">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{q.questionText}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {q.subject && <Badge tone="blue">{q.subject}</Badge>}
                      <Badge tone="green">Ans: {q.correctOption}</Badge>
                      {!q.isActive && <Badge tone="red">Archived - remove before publishing</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100" onClick={() => setEditor({ open: true, question: q })} aria-label="Edit question">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        setOrder((o) => o.filter((x) => x._id !== q._id));
                        setDirty(true);
                      }}
                      aria-label="Remove from test"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No questions yet" message="Add questions from the bank, write new ones or import a spreadsheet." />
          )}
        </div>
      )}

      <QuestionPicker open={picker} onClose={() => setPicker(false)} testId={test._id} />
      <QuestionEditor
        open={editor.open}
        question={editor.question}
        attachToTestId={editor.question ? undefined : test._id}
        defaults={{ sourceExam: isPyq ? test.paperName || test.title : '', sourceYear: test.paperYear }}
        onClose={() => setEditor({ open: false })}
      />
      <TestPreview open={preview} onClose={() => setPreview(false)} testId={test._id} />
    </div>
  );
}
