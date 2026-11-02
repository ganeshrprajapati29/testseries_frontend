import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, Flag, Pencil, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryChips } from '@/components/admin/CategoryPicker';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { StatCard } from '@/components/admin/StatCard';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ImageGallery } from '@/components/common/ImageGallery';
import { Textarea } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { REPORT_REASON_LABELS } from '@/components/tests/ReportQuestion';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime } from '@/lib/formatters';
import { cn, OPTION_LABELS } from '@/lib/utils';
import type { Question, ReportReason, ReportStatus } from '@/types';
import { adminApi } from '../admin.api';
import type { ReportGroup } from '../admin.types';
import { useAdminMutation } from '../hooks/useAdminMutation';

const STATUS_TONE: Record<ReportStatus, 'red' | 'green' | 'gray'> = { open: 'red', resolved: 'green', dismissed: 'gray' };
const STATUS_LABEL: Record<ReportStatus, string> = { open: 'Open', resolved: 'Resolved', dismissed: 'Dismissed' };

function ReasonChips({ counts }: { counts: Partial<Record<ReportReason, number>> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(Object.entries(counts) as [ReportReason, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([reason, n]) => (
          <span key={reason} className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-800">
            {REPORT_REASON_LABELS[reason]} {n > 1 && `× ${n}`}
          </span>
        ))}
    </div>
  );
}

function QuestionPreview({ question }: { question: Question }) {
  const hi = question.translations?.find((t) => t.language === 'hi');
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="prose-text font-medium">{question.questionText}</p>
      {hi?.questionText && (
        <p lang="hi" className="prose-text mt-1 text-sm text-slate-600">
          {hi.questionText}
        </p>
      )}
      <ImageGallery images={[question.imageUrl, ...(question.images ?? [])].filter(Boolean)} className="mt-3 max-w-xl" compact />
      <ul className="mt-3 space-y-1.5">
        {question.options.map((o, i) => {
          const correct = o.key === question.correctOption;
          const hiText = hi?.options.find((h) => h.key === o.key)?.text;
          return (
            <li key={o.key} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', correct ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200')}>
              <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', correct ? 'bg-emerald-600 text-white' : 'bg-slate-100')}>{OPTION_LABELS[i]}</span>
              <span className="flex-1">
                {o.text}
                {hiText && hiText !== o.text && (
                  <span lang="hi" className="block text-xs text-slate-500">
                    {hiText}
                  </span>
                )}
                {o.imageUrl && <img src={o.imageUrl} alt="" className="mt-1 max-h-24 rounded border" />}
              </span>
              {correct && <span className="text-xs font-semibold text-emerald-700">Answer key</span>}
            </li>
          );
        })}
      </ul>
      {question.explanation && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-slate-700">
          <span className="font-semibold">Explanation: </span>
          {question.explanation}
        </p>
      )}
    </div>
  );
}

function ReviewModal({ group, onClose, onEdit }: { group: ReportGroup; onClose: () => void; onEdit: () => void }) {
  const { data: reports, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'question-reports', 'question', group.questionId], queryFn: () => adminApi.reportsForQuestion(group.questionId) });
  const [note, setNote] = useState('');
  const openCount = reports?.filter((r) => r.status === 'open').length ?? 0;
  const closeAll = useAdminMutation((status: 'resolved' | 'dismissed') => adminApi.closeQuestionReports(group.questionId, { status, adminNote: note.trim() }), {
    success: (r) => r.message ?? 'Updated',
    onSuccess: onClose,
  });
  const updateOne = useAdminMutation((v: { id: string; status: ReportStatus }) => adminApi.updateReport(v.id, { status: v.status, ...(v.status !== 'open' && note.trim() ? { adminNote: note.trim() } : {}) }), {
    success: (r) => `Report marked ${r.status}`,
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Review reported question"
      description={`${group.count} report(s) • last reported ${formatDateTime(group.latestAt)}`}
      footer={
        openCount > 0 ? (
          <>
            <Button variant="outline" icon={<XCircle className="h-4 w-4" />} loading={closeAll.isPending && closeAll.variables === 'dismissed'} onClick={() => closeAll.mutate('dismissed')}>
              Dismiss all open ({openCount})
            </Button>
            <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} loading={closeAll.isPending && closeAll.variables === 'resolved'} onClick={() => closeAll.mutate('resolved')}>
              Mark all resolved ({openCount})
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-5">
        {group.question ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CategoryChips categories={group.question.categories} max={3} />
              <Button size="sm" icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
                Edit / fix question
              </Button>
            </div>
            <QuestionPreview question={group.question} />
            <p className="text-xs text-slate-500">
              Fixing the question applies to new attempts. Results already given to students are not re-scored automatically.
            </p>
          </>
        ) : (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This question was deleted.</p>
        )}

        <section>
          <h3 className="mb-2 font-semibold">Reports from students</h3>
          {isLoading ? (
            <Loader />
          ) : error || !reports ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {reports.map((r) => (
                <li key={r._id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      <span className="font-semibold">{REPORT_REASON_LABELS[r.reason]}</span>
                      {r.language === 'hi' && <Badge tone="orange">Hindi</Badge>}
                    </div>
                    {r.comment && <p className="mt-1 text-slate-700">“{r.comment}”</p>}
                    <p className="mt-1 text-xs text-slate-500">
                      {r.studentId ? `${r.studentId.name} (${r.studentId.email})` : 'Deleted student'} •{' '}
                      {r.testId ? (
                        <Link to={`/admin/tests/${r.testId._id}`} className="hover:text-brand-700 hover:underline">
                          {r.testId.title}
                        </Link>
                      ) : (
                        'Deleted test'
                      )}
                      {r.questionNumber ? ` • Q${r.questionNumber}` : ''} • {formatDateTime(r.createdAt)}
                    </p>
                    {r.status !== 'open' && (
                      <p className="mt-1 text-xs text-emerald-700">
                        {r.resolvedBy?.name ?? 'Admin'} {r.status} on {formatDateTime(r.resolvedAt)}
                        {r.adminNote && ` - “${r.adminNote}”`}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {r.status === 'open' ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateOne.mutate({ id: r._id, status: 'dismissed' })}>
                          Dismiss
                        </Button>
                        <Button size="sm" variant="success" onClick={() => updateOne.mutate({ id: r._id, status: 'resolved' })}>
                          Resolve
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => updateOne.mutate({ id: r._id, status: 'open' })}>
                        Re-open
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {openCount > 0 && (
          <Textarea
            label="Reply to the students (optional)"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint="Shown to the students under this question in their solutions, e.g. “Thanks - the answer key has been corrected to C.”"
          />
        )}
      </div>
    </Modal>
  );
}

export default function AdminReportsPage() {
  const { page, get, setFilter, setPage } = usePagination();
  const status = get('status') || 'open';
  const params = { page, limit: 15, status, reason: get('reason'), search: get('search') };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'question-reports', 'list', params], queryFn: () => adminApi.questionReports(params), placeholderData: (p) => p });
  const counts = useQuery({ queryKey: ['admin', 'question-reports', 'counts'], queryFn: adminApi.questionReportCounts });
  const [reviewing, setReviewing] = useState<ReportGroup | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useQuery({ queryKey: ['admin', 'question', editingId], queryFn: () => adminApi.question(editingId!), enabled: !!editingId });
  const c = counts.data;

  const tabs: { value: string; label: string; n?: number }[] = [
    { value: 'open', label: 'Open', n: c?.open },
    { value: 'resolved', label: 'Resolved', n: c?.resolved },
    { value: 'dismissed', label: 'Dismissed', n: c?.dismissed },
    { value: 'all', label: 'All' },
  ];

  return (
    <div>
      <PageHeader title="Reported Questions" description="Questions students reported as wrong during tests or in solutions. Most reported first." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Questions to review" value={c?.openQuestions ?? '-'} icon={Flag} tone="red" />
        <StatCard label="Open reports" value={c?.open ?? '-'} icon={ClipboardList} tone="orange" />
        <StatCard label="Resolved" value={c?.resolved ?? '-'} icon={CheckCircle2} tone="green" />
        <StatCard label="Dismissed" value={c?.dismissed ?? '-'} icon={XCircle} tone="slate" />
      </div>

      <div className="card mb-4 p-3">
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Report status">
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={status === t.value}
              onClick={() => setFilter('status', t.value === 'open' ? '' : t.value)}
              className={cn('rounded-full px-3 py-1 text-sm font-semibold', status === t.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              {t.label}
              {t.n !== undefined && <span className="ml-1.5 opacity-75">{t.n}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={get('search')} onSearch={(v) => setFilter('search', v)} placeholder="Search question text..." className="flex-1" />
          <select className="field sm:w-64" value={get('reason')} onChange={(e) => setFilter('reason', e.target.value)} aria-label="Reason">
            <option value="">All reasons</option>
            {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((r) => (
              <option key={r} value={r}>
                {REPORT_REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <EmptyState title={status === 'open' ? 'No open reports' : 'Nothing here'} message={status === 'open' ? 'Great - students have not reported any problems.' : undefined} />
      ) : (
        <div className="space-y-3">
          {data.items.map((g) => (
            <article key={g.questionId} className="card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone="red">
                      <Flag className="h-3 w-3" /> {g.count} report{g.count > 1 ? 's' : ''}
                    </Badge>
                    {g.question && <Badge tone="green">Answer {g.question.correctOption}</Badge>}
                    {g.question && !g.question.isActive && <Badge tone="gray">Archived</Badge>}
                    <span className="text-xs text-slate-500">Last {formatDateTime(g.latestAt)}</span>
                  </div>
                  <p className="line-clamp-2 font-medium text-slate-900">{g.question?.questionText ?? 'Deleted question'}</p>
                  <div className="mt-2">
                    <ReasonChips counts={g.reasonCounts} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {g.question && <CategoryChips categories={g.question.categories} max={2} />}
                    {g.tests.map((t) => (
                      <Link key={t._id} to={`/admin/tests/${t._id}`} className="hover:text-brand-700 hover:underline">
                        {t.moduleType === 'PYQS' ? 'Paper' : 'Test'}: {t.title}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {g.question && (
                    <Button size="sm" variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditingId(g.questionId)}>
                      Edit
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setReviewing(g)}>
                    Review
                  </Button>
                </div>
              </div>
            </article>
          ))}
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}

      {reviewing && (
        <ReviewModal
          group={reviewing}
          onClose={() => setReviewing(null)}
          onEdit={() => {
            setEditingId(reviewing.questionId);
            setReviewing(null);
          }}
        />
      )}
      <QuestionEditor open={!!editingId && !!editing.data} question={editing.data ?? null} onClose={() => setEditingId(null)} />
    </div>
  );
}
