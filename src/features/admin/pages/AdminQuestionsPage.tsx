import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FolderInput, Languages, ListChecks, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslationEnabled } from '@/components/admin/HindiTranslate';
import { CategoryChips, CategoryPicker, useFlatCategories } from '@/components/admin/CategoryPicker';
import { DataTable } from '@/components/admin/DataTable';
import { QuestionBankTree } from '@/components/admin/QuestionBankTree';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button, ButtonLink } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { ImageGallery } from '@/components/common/ImageGallery';
import { SearchInput } from '@/components/common/SearchInput';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/lib/formatters';
import { cn, OPTION_LABELS } from '@/lib/utils';
import type { Question } from '@/types';
import { adminApi } from '../admin.api';
import { RowActions } from '../components/RowActions';
import { useAdminMutation } from '../hooks/useAdminMutation';
import { questionLink, useCopyQuestionLink, useOpenQuestionOnWebsite } from '../hooks/useCopyQuestionLink';

export default function AdminQuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const copyLink = useCopyQuestionLink();
  const openOnWebsite = useOpenQuestionOnWebsite();
  const { page, get, setFilter, setPage } = usePagination();
  const [editor, setEditor] = useState<{ open: boolean; question?: Question | null }>({ open: false });
  const [preview, setPreview] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ open: boolean; mode: 'add' | 'replace' | 'remove'; categoryIds: string[] }>({ open: false, mode: 'add', categoryIds: [] });
  const { tree, flat } = useFlatCategories();
  const category = get('category');
  const categoryLabel = category === 'none' ? 'Uncategorized' : flat.find((c) => c.id === category)?.label;

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditor({ open: true, question: null });
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const archived = get('archived') === '1';
  const testId = get('testId');
  const translationOn = useTranslationEnabled();
  const forTest = useQuery({ queryKey: ['admin', 'test', testId], queryFn: () => adminApi.test(testId), enabled: !!testId });
  const params = {
    page,
    limit: 20,
    search: get('search'),
    subject: get('subject'),
    difficulty: get('difficulty'),
    sourceExam: get('sourceExam'),
    sourceYear: get('sourceYear'),
    isActive: archived ? 'false' : 'true',
    category,
    testId,
    hindi: get('hindi'),
  };
  const facets = useQuery({ queryKey: ['admin', 'question-facets'], queryFn: adminApi.questionFacets });
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'questions', params], queryFn: () => adminApi.questions(params), placeholderData: (p) => p });

  const archive = useAdminMutation((id: string) => adminApi.archiveQuestion(id), { success: 'Question archived' });
  const restore = useAdminMutation((id: string) => adminApi.restoreQuestion(id), { success: 'Question restored' });
  const remove = useAdminMutation((id: string) => adminApi.deleteQuestion(id), { success: 'Question deleted', onSuccess: () => setDeleting(null) });
  const bulkSave = useAdminMutation(() => adminApi.bulkQuestionCategories([...selected], bulk.categoryIds, bulk.mode), {
    success: (r) => `${r.updated} question(s) updated`,
    onSuccess: () => {
      setSelected(new Set());
      setBulk({ open: false, mode: 'add', categoryIds: [] });
    },
  });
  const bulkTranslate = useAdminMutation(() => adminApi.bulkTranslateQuestions([...selected].slice(0, 100)), {
    success: (r) => r.message ?? 'Translated',
    onSuccess: () => setSelected(new Set()),
  });
  const pageIds = data?.items.map((q) => q._id) ?? [];
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // New questions go into the category currently open in the tree.
  const newDefaults = category && category !== 'none' ? { categoryIds: [category] } : undefined;

  return (
    <div>
      <PageHeader
        title="Question Bank"
        description="Browse questions by category. A question can belong to several categories and be reused in many tests."
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
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <QuestionBankTree tree={tree} selected={category} onSelect={(id) => setFilter('category', id)} total={facets.data?.total} uncategorized={facets.data?.uncategorized} />
        </aside>
        <div className="min-w-0">
      {testId && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-900">
          <ListChecks className="h-4 w-4" />
          <span>
            Showing the questions of <b>{forTest.data?.title ?? 'this test'}</b>
            {forTest.data?.categoryLabel && <span className="text-accent-800"> ({forTest.data.categoryLabel})</span>}
          </span>
          <span className="ml-auto flex items-center gap-3">
            <Link to={`/admin/tests/${testId}`} className="text-xs font-semibold hover:underline">
              Open {forTest.data?.moduleType === 'PYQS' ? 'paper' : 'test'} →
            </Link>
            <button type="button" onClick={() => setFilter('testId', '')} className="flex items-center gap-1 text-xs font-semibold hover:underline">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </span>
        </div>
      )}
      {categoryLabel && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          <span>
            Showing questions in <b>{categoryLabel}</b>
            {category !== 'none' && ' and its sub-categories'}
          </span>
          <button type="button" onClick={() => setFilter('category', '')} className="ml-auto flex items-center gap-1 text-xs font-semibold hover:underline">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <SearchInput value={get('search')} onSearch={(v) => setFilter('search', v)} placeholder="Search question text..." />
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
        <select className="field" value={get('hindi')} onChange={(e) => setFilter('hindi', e.target.value)} aria-label="Hindi version">
          <option value="">Any language</option>
          <option value="yes">Hindi available</option>
          <option value="no">English only (no Hindi)</option>
        </select>
        <select className="field" value={archived ? '1' : ''} onChange={(e) => setFilter('archived', e.target.value)} aria-label="Status">
          <option value="">Active questions</option>
          <option value="1">Archived questions</option>
        </select>
      </div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 shadow-card">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <Button size="sm" icon={<FolderInput className="h-4 w-4" />} onClick={() => setBulk({ open: true, mode: 'add', categoryIds: category && category !== 'none' ? [category] : [] })}>
            Assign categories
          </Button>
          {translationOn && (
            <Button size="sm" variant="secondary" icon={<Languages className="h-4 w-4" />} loading={bulkTranslate.isPending} onClick={() => bulkTranslate.mutate(undefined)}>
              Translate to Hindi{selected.size > 100 ? ' (first 100)' : ''}
            </Button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-slate-500 hover:underline">
            Clear selection
          </button>
        </div>
      )}
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
            key: 'sel',
            header: (
              <input
                type="checkbox"
                className="accent-brand-600"
                aria-label="Select all on this page"
                checked={allOnPage}
                onChange={() =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)));
                    return next;
                  })
                }
              />
            ),
            className: 'w-8',
            render: (r) => <input type="checkbox" className="accent-brand-600" aria-label="Select question" checked={selected.has(r._id)} onChange={() => toggle(r._id)} />,
          },
          {
            key: 'q',
            header: 'Question',
            className: 'max-w-xl',
            render: (r) => (
              <div>
                <button type="button" onClick={() => setPreview(r)} className="text-left">
                  <p className="line-clamp-2 text-slate-900 hover:text-brand-700">{r.questionText}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {r.options.length} options • Answer {r.correctOption}
                    {r.language === 'hi' || r.translations.some((t) => t.language === 'hi') ? ' • Hindi available' : ''}
                    {r.imageUrl || r.images?.length ? ` • ${[r.imageUrl, ...(r.images ?? [])].filter(Boolean).length} image(s)` : ''}
                  </p>
                </button>
                <Link to={questionLink(r._id)} className="text-[11px] font-semibold text-brand-700 hover:underline">
                  Open question page →
                </Link>
              </div>
            ),
          },
          {
            key: 'cats',
            header: 'Category',
            render: (r) => <CategoryChips categories={r.categories} max={2} />,
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
          { key: 'used', header: 'Used in', render: (r) => `${r.usedInTests ?? 0} test(s)` },
          { key: 'date', header: 'Added', render: (r) => <span className="text-slate-500">{formatDate(r.createdAt)}</span> },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r) => (
              <RowActions
                actions={[
                  { label: 'Open question page', onClick: () => navigate(questionLink(r._id)) },
                  { label: 'View on website', onClick: () => void openOnWebsite(r._id) },
                  { label: 'Copy question link', onClick: () => copyLink(r._id) },
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

        </div>
      </div>

      <QuestionEditor open={editor.open} question={editor.question} defaults={editor.question ? undefined : newDefaults} onClose={() => setEditor({ open: false })} />

      <Modal
        open={bulk.open}
        onClose={() => setBulk({ ...bulk, open: false })}
        title={`Categories for ${selected.size} question(s)`}
        footer={
          <>
            <Button variant="outline" onClick={() => setBulk({ ...bulk, open: false })}>
              Cancel
            </Button>
            <Button loading={bulkSave.isPending} disabled={bulk.mode !== 'replace' && !bulk.categoryIds.length} onClick={() => bulkSave.mutate(undefined)}>
              Apply
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {(
              [
                ['add', 'Add to'],
                ['replace', 'Replace with'],
                ['remove', 'Remove from'],
              ] as const
            ).map(([m, label]) => (
              <button key={m} type="button" onClick={() => setBulk({ ...bulk, mode: m })} className={cn('rounded-md py-1.5', bulk.mode === m ? 'bg-white shadow-sm' : 'text-slate-500')}>
                {label}
              </button>
            ))}
          </div>
          <CategoryPicker
            label="Categories / sub-categories"
            value={bulk.categoryIds}
            onChange={(ids) => setBulk({ ...bulk, categoryIds: ids })}
            hint={bulk.mode === 'add' ? 'Keeps existing categories and adds these.' : bulk.mode === 'replace' ? 'Existing categories are replaced (leave empty to clear them).' : 'Only these categories are removed.'}
          />
        </div>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Question preview" size="lg">
        {preview && (
          <div className="space-y-4">
            <p className="prose-text">{preview.questionText}</p>
            <ImageGallery images={[preview.imageUrl, ...(preview.images ?? [])]} />
            <ul className="space-y-2">
              {preview.options.map((o, i) => (
                <li key={o.key} className={cn('rounded-lg border-2 px-3 py-2 text-sm', o.key === preview.correctOption ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200')}>
                  <b>{OPTION_LABELS[i]}.</b> {o.text}
                  {o.imageUrl && <img src={o.imageUrl} alt="" className="mt-1 max-h-24 rounded" />}
                </li>
              ))}
            </ul>
            {(preview.explanation || (preview.explanationImages?.length ?? 0) > 0) && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm">
                <p className="prose-text">{preview.explanation}</p>
                <ImageGallery images={preview.explanationImages ?? []} className="mt-2" compact />
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">Categories</p>
              <CategoryChips categories={preview.categories} max={10} />
            </div>
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
