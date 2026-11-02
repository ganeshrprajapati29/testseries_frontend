import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, ExternalLink, FolderTree, Globe, Lightbulb, Pencil, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Button, buttonClasses } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { ImageGallery } from '@/components/common/ImageGallery';
import { Loader } from '@/components/common/Loader';
import { formatDateTime } from '@/lib/formatters';
import { cn, OPTION_LABELS } from '@/lib/utils';
import { adminApi } from '../admin.api';
import { useCopyQuestionLink } from '../hooks/useCopyQuestionLink';


/** Direct link page for one question: /admin/questions/:id */
export default function AdminQuestionViewPage() {
  const { id = '' } = useParams();
  const [editing, setEditing] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const copyLink = useCopyQuestionLink();
  const { data: q, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'question', id], queryFn: () => adminApi.question(id) });

  if (isLoading) return <Loader />;
  if (error || !q) return <ErrorState error={error} onRetry={() => refetch()} title="Question not found" />;

  const hi = q.translations?.find((t) => t.language === 'hi');
  const showHi = lang === 'hi' && !!hi;
  const text = showHi ? hi!.questionText : q.questionText;
  const optionText = (key: string, fallback: string) => (showHi ? hi!.options.find((o) => o.key === key)?.text || fallback : fallback);
  const explanation = showHi ? hi!.explanation || q.explanation : q.explanation;

  return (
    <div className="max-w-5xl space-y-5">
      <Link to="/admin/questions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Question Bank
      </Link>

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={q.isActive ? 'green' : 'red'}>{q.isActive ? 'Active' : 'Archived'}</Badge>
            <Badge tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'easy' ? 'green' : 'amber'}>{q.difficulty}</Badge>
            {q.subject && <Badge tone="blue">{q.subject}</Badge>}
            {q.topic && <Badge tone="gray">{q.topic}</Badge>}
            {q.sourceExam && (
              <Badge tone="orange">
                {q.sourceExam} {q.sourceYear ?? ''}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {hi && (
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                {(['en', 'hi'] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} className={cn('rounded-md px-2.5 py-1', lang === l ? 'bg-white shadow-sm' : 'text-slate-500')}>
                    {l === 'en' ? 'English' : 'हिंदी'}
                  </button>
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyLink(q._id)}>
              Copy link
            </Button>
            {q.isActive && (
              <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </div>

        <p className="prose-text text-lg font-medium" lang={showHi ? 'hi' : undefined}>
          {text}
        </p>
        <ImageGallery images={[q.imageUrl, ...(q.images ?? [])].filter(Boolean)} className="mt-3 max-w-2xl" compact />
        <ul className="mt-4 space-y-2">
          {q.options.map((o, i) => {
            const correct = o.key === q.correctOption;
            return (
              <li key={o.key} className={cn('flex items-start gap-3 rounded-lg border-2 px-3 py-2', correct ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200')}>
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', correct ? 'bg-emerald-600 text-white' : 'bg-slate-100')}>{OPTION_LABELS[i]}</span>
                <span className="flex-1" lang={showHi ? 'hi' : undefined}>
                  {optionText(o.key, o.text)}
                  {o.imageUrl && <img src={o.imageUrl} alt="" className="mt-2 max-h-32 rounded border" />}
                </span>
                {correct && <span className="text-xs font-semibold text-emerald-700">Correct answer</span>}
              </li>
            );
          })}
        </ul>
        {explanation && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
              <Lightbulb className="h-4 w-4" /> Explanation
            </p>
            <p className="prose-text text-sm text-slate-700" lang={showHi ? 'hi' : undefined}>
              {explanation}
            </p>
          </div>
        )}
        <ImageGallery images={q.explanationImages ?? []} className="mt-3 max-w-2xl" compact />
        <p className="mt-4 text-xs text-slate-400">
          Added {formatDateTime(q.createdAt)} • ID {q._id}
          {q.tags?.length ? ` • Tags: ${q.tags.join(', ')}` : ''}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <FolderTree className="h-4 w-4 text-brand-600" /> Categories
          </h2>
          {q.categories?.length ? (
            <ul className="space-y-1.5">
              {q.categories.map((c) => (
                <li key={c._id}>
                  <Link to={`/admin/questions?category=${c._id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {c.label}
                  </Link>{' '}
                  <span className="text-xs text-slate-400">{c.moduleType === 'PYQS' ? 'PYQs' : 'Test Series'}</span>
                  {c.siteUrl && (
                    <a href={c.siteUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                      website page <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-amber-700">Not in any category - students only see it if you add it to a test.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Globe className="h-4 w-4 text-brand-600" /> On the website
          </h2>
          {q.websiteLinks.length ? (
            <ul className="mb-4 space-y-3">
              {q.websiteLinks.map((w) => (
                <li key={w.testId} className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
                  <p className="font-semibold text-slate-900">
                    {w.title}{' '}
                    {w.isPracticeSet && (
                      <Badge tone="purple">
                        <Sparkles className="h-3 w-3" /> Practice set
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Students see it as <b>question {w.questionNumber} of {w.totalQuestions}</b> when they attempt this {w.url.startsWith('/pyqs') ? 'paper' : 'test'}.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', 'sm')}>
                      <ExternalLink className="h-3.5 w-3.5" /> Open on website
                    </a>
                    {w.categoryUrl && (
                      <a href={w.categoryUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline', 'sm')}>
                        <FolderTree className="h-3.5 w-3.5" /> Category page
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {q.isActive
                ? q.categories?.length
                  ? 'Not on the website yet - refresh in a moment; questions in an active category are published automatically.'
                  : 'Not on the website: give it a category or add it to a published test.'
                : 'Archived questions are not shown to students.'}
            </p>
          )}
          {q.tests.length ? (
            <ul className="space-y-2">
              <li className="text-xs font-semibold tracking-wide text-slate-400 uppercase">In admin</li>
              {q.tests.map((t) => (
                <li key={t._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <Link to={`/admin/tests/${t._id}`} className="font-medium hover:text-brand-700 hover:underline">
                      {t.title}
                    </Link>{' '}
                    {t.autoCategoryId && (
                      <Badge tone="purple">
                        <Sparkles className="h-3 w-3" /> Practice set
                      </Badge>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={t.publicationStatus} />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <QuestionEditor
        open={editing}
        question={q}
        onClose={() => setEditing(false)}
        onSaved={() => {
          void refetch();
        }}
      />
    </div>
  );
}
