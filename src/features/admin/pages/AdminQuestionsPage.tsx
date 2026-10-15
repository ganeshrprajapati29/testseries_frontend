import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable } from '@/components/admin/DataTable';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button, ButtonLink } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { SearchInput } from '@/components/common/SearchInput';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/lib/formatters';
import { cn, OPTION_LABELS } from '@/lib/utils';
import type { Question } from '@/types';
import { adminApi } from '../admin.api';
import { RowActions } from '../components/RowActions';
import { useAdminMutation } from '../hooks/useAdminMutation';

export default function AdminQuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, get, setFilter, setPage } = usePagination();
  const [editor, setEditor] = useState<{ open: boolean; question?: Question | null }>({ open: false });
  const [preview, setPreview] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditor({ open: true, question: null });
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const archived = get('archived') === '1';
  const params = {
    page,
    limit: 20,
    search: get('search'),
    subject: get('subject'),
    difficulty: get('difficulty'),
    sourceExam: get('sourceExam'),
    sourceYear: get('sourceYear'),
    isActive: archived ? 'false' : 'true',
  };
  const facets = useQuery({ queryKey: ['admin', 'question-facets'], queryFn: adminApi.questionFacets });
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'questions', params], queryFn: () => adminApi.questions(params), placeholderData: (p) => p });

  const archive = useAdminMutation((id: string) => adminApi.archiveQuestion(id), { success: 'Question archived' });
  const restore = useAdminMutation((id: string) => adminApi.restoreQuestion(id), { success: 'Question restored' });
  const remove = useAdminMutation((id: string) => adminApi.deleteQuestion(id), { success: 'Question deleted', onSuccess: () => setDeleting(null) });

  return (
    <div>
      <PageHeader
        title="Question Bank"
        description="Reusable questions. A question can be used in many tests without duplication."
        actions={
          <>
            <ButtonLink to="/admin/imports" variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />}>
              Bulk import
            </ButtonLink>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditor({ open: true, question: null })}>
              New question
            </Button>
          </>
        }
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <SearchInput value={get('search')} onSearch={(v) => setFilter('search', v)} placeholder="Search question text..." className="lg:col-span-2" />
        <select className="field" value={get('subject')} onChange={(e) => setFilter('subject', e.target.value)} aria-label="Subject">
          <option value="">All subjects</option>
          {facets.data?.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="field" value={get('difficulty')} onChange={(e) => setFilter('difficulty', e.target.value)} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select className="field" value={get('sourceExam')} onChange={(e) => setFilter('sourceExam', e.target.value)} aria-label="Source exam">
          <option value="">Any source</option>
          {facets.data?.sourceExams.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="field" value={archived ? '1' : ''} onChange={(e) => setFilter('archived', e.target.value)} aria-label="Status">
          <option value="">Active questions</option>
          <option value="1">Archived questions</option>
        </select>
      </div>
      <DataTable<Question>
        rows={data?.items}
        meta={data?.meta}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r._id}
        emptyTitle={archived ? 'No archived questions' : 'No questions found'}
        emptyAction={!archived && <Button size="sm" onClick={() => setEditor({ open: true, question: null })}>Add a question</Button>}
        columns={[
          {
            key: 'q',
            header: 'Question',
            className: 'max-w-xl',
            render: (r) => (
              <button type="button" onClick={() => setPreview(r)} className="text-left">
                <p className="line-clamp-2 text-slate-900 hover:text-brand-700">{r.questionText}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.options.length} options • Answer {r.correctOption}
                  {r.translations.length ? ' • Hindi available' : ''}
                </p>
              </button>
            ),
          },
          {
            key: 'meta',
            header: 'Subject / Topic',
            render: (r) => (
              <div className="text-xs">
                <p className="font-medium text-slate-700">{r.subject || '-'}</p>
                <p className="text-slate-500">{r.topic}</p>
              </div>
            ),
          },
          { key: 'diff', header: 'Level', render: (r) => <Badge tone={r.difficulty === 'hard' ? 'red' : r.difficulty === 'easy' ? 'green' : 'amber'}>{r.difficulty}</Badge> },
          { key: 'src', header: 'Source', render: (r) => (r.sourceExam ? `${r.sourceExam}${r.sourceYear ? ` ${r.sourceYear}` : ''}` : '-') },
          { key: 'used', header: 'Used in', render: (r) => `${r.usedInTests ?? 0} test(s)` },
          { key: 'date', header: 'Added', render: (r) => <span className="text-slate-500">{formatDate(r.createdAt)}</span> },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r) => (
              <RowActions
                actions={[
                  { label: 'Preview', onClick: () => setPreview(r) },
                  { label: 'Edit', onClick: () => setEditor({ open: true, question: r }), hidden: !r.isActive },
                  { label: 'Archive', onClick: () => archive.mutate(r._id), hidden: !r.isActive },
                  { label: 'Restore', onClick: () => restore.mutate(r._id), hidden: r.isActive },
                  { label: 'Delete permanently', danger: true, onClick: () => setDeleting(r), hidden: (r.usedInTests ?? 0) > 0 },
                ]}
              />
            ),
          },
        ]}
      />

      <QuestionEditor open={editor.open} question={editor.question} onClose={() => setEditor({ open: false })} />

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Question preview" size="lg">
        {preview && (
          <div className="space-y-4">
            <p className="prose-text">{preview.questionText}</p>
            {preview.imageUrl && <img src={preview.imageUrl} alt="" className="max-h-60 rounded border" />}
            <ul className="space-y-2">
              {preview.options.map((o, i) => (
                <li key={o.key} className={cn('rounded-lg border-2 px-3 py-2 text-sm', o.key === preview.correctOption ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200')}>
                  <b>{OPTION_LABELS[i]}.</b> {o.text}
                  {o.imageUrl && <img src={o.imageUrl} alt="" className="mt-1 max-h-24 rounded" />}
                </li>
              ))}
            </ul>
            {preview.explanation && <p className="prose-text rounded-lg bg-amber-50 p-3 text-sm">{preview.explanation}</p>}
            {preview.translations.map((t) => (
              <div key={t.language} className="rounded-lg border border-slate-200 p-3" lang={t.language}>
                <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">{t.language === 'hi' ? 'Hindi' : 'English'}</p>
                <p className="prose-text text-sm">{t.questionText}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {t.options.map((o) => (
                    <li key={o.key}>
                      {o.key}. {o.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        title="Delete question permanently?"
        message="This cannot be undone. Questions used in tests or attempts cannot be deleted - archive them instead."
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting._id)}
      />
    </div>
  );
}
