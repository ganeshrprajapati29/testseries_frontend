import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Checkbox } from '@/components/common/Input';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { Loader } from '@/components/common/Loader';
import { adminApi } from '@/features/admin/admin.api';
import { testSeriesApi } from '@/features/test-series/testSeries.api';
import { useSettings } from '@/hooks/useSettings';
import { formatScore, TEST_TYPE_LABELS } from '@/lib/formatters';
import { OPTION_LABELS } from '@/lib/utils';
import type { Language, PrintablePaper } from '@/types';

/** A4 question paper that can be printed or saved as PDF from the browser (keeps Hindi and figures). */
function PaperView({ paper, backTo }: { paper: PrintablePaper; backTo: string }) {
  const { settings, logoUrl, siteName } = useSettings();
  const [lang, setLang] = useState<Language>(paper.languageOptions[0] ?? 'en');
  const [answerKey, setAnswerKey] = useState(true);
  const [explanations, setExplanations] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = `${paper.title} - ${siteName}`;
    return () => {
      document.title = prev;
    };
  }, [paper.title, siteName]);

  const text = (q: PrintablePaper['questions'][number]) => {
    const t = q.translations.find((tr) => tr.language === lang);
    return {
      question: t?.questionText || q.questionText,
      option: (key: string) => t?.options.find((o) => o.key === key)?.text || q.options.find((o) => o.key === key)?.text || '',
      explanation: t?.explanation || q.explanation,
    };
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to={backTo} className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <LanguageSelector value={lang} options={paper.languageOptions} onChange={setLang} />
            <Checkbox label="Answer key" checked={answerKey} onChange={(e) => setAnswerKey(e.target.checked)} />
            <Checkbox label="Explanations" checked={explanations} onChange={(e) => setExplanations(e.target.checked)} />
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      <article className="paper mx-auto my-6 max-w-4xl bg-white px-6 py-8 shadow-card sm:px-10 print:my-0 print:max-w-none print:px-0 print:py-0 print:shadow-none" lang={lang}>
        <header className="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
          <img src={logoUrl} alt="" className="h-16 w-16 object-contain" />
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{siteName} • {settings?.tagline}</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{paper.title}</h1>
            <p className="text-sm text-slate-600">
              {[paper.paperName, TEST_TYPE_LABELS[paper.testType]].filter(Boolean).join(' • ')}
            </p>
          </div>
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4 print:bg-white print:ring-1 print:ring-slate-300">
          <div>
            <dt className="text-xs text-slate-500">Questions</dt>
            <dd className="font-bold">{paper.questions.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Time</dt>
            <dd className="font-bold">{paper.durationMinutes} minutes</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Maximum marks</dt>
            <dd className="font-bold">{formatScore(paper.questions.length * paper.marksPerCorrect)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Marking</dt>
            <dd className="font-bold">
              +{formatScore(paper.marksPerCorrect)} / −{formatScore(paper.negativeMarks)}
            </dd>
          </div>
        </dl>
        {paper.instructions && <p className="prose-text mt-4 text-sm text-slate-700">{paper.instructions}</p>}

        <ol className="mt-6 space-y-6">
          {paper.questions.map((q) => {
            const t = text(q);
            const shortOptions = q.options.every((o) => (t.option(o.key).length < 38 && !o.imageUrl));
            return (
              <li key={q.number} className="paper-question break-inside-avoid">
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 font-bold text-slate-900">{q.number}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="prose-text text-[15px]">{t.question}</p>
                    {q.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {q.images.map((src) => (
                          <img key={src} src={src} alt="" className="max-h-64 max-w-full rounded border border-slate-200 object-contain" />
                        ))}
                      </div>
                    )}
                    <ol className={shortOptions ? 'mt-2 grid grid-cols-2 gap-x-6 gap-y-1' : 'mt-2 space-y-1'}>
                      {q.options.map((o, i) => (
                        <li key={o.key} className="text-sm">
                          <span className="font-semibold">({OPTION_LABELS[i]!.toLowerCase()})</span> {t.option(o.key)}
                          {o.imageUrl && <img src={o.imageUrl} alt="" className="mt-1 max-h-28 rounded border border-slate-200" />}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {answerKey && (
          <section className="mt-10 break-before-page border-t-2 border-slate-900 pt-6">
            <h2 className="text-lg font-bold">Answer key</h2>
            <div className="mt-3 grid grid-cols-5 gap-2 text-sm sm:grid-cols-10">
              {paper.questions.map((q) => {
                const idx = q.options.findIndex((o) => o.key === q.correctOption);
                return (
                  <div key={q.number} className="rounded border border-slate-200 px-2 py-1 text-center">
                    <span className="text-slate-500">{q.number}.</span> <b>{OPTION_LABELS[idx]?.toLowerCase() ?? q.correctOption}</b>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {explanations && (
          <section className="mt-10 border-t-2 border-slate-900 pt-6">
            <h2 className="text-lg font-bold">Explanations</h2>
            <ol className="mt-4 space-y-4">
              {paper.questions.map((q) => {
                const t = text(q);
                const idx = q.options.findIndex((o) => o.key === q.correctOption);
                return (
                  <li key={q.number} className="break-inside-avoid text-sm">
                    <p>
                      <b>{q.number}.</b> Answer: <b>({OPTION_LABELS[idx]?.toLowerCase()})</b> {t.option(q.correctOption)}
                    </p>
                    {t.explanation && <p className="prose-text mt-1 text-slate-700">{t.explanation}</p>}
                    {q.explanationImages.map((src) => (
                      <img key={src} src={src} alt="" className="mt-2 max-h-56 rounded border border-slate-200" />
                    ))}
                  </li>
                );
              })}
            </ol>
          </section>
        )}
        <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-xs text-slate-400">
          {siteName} • {settings?.mainWebsiteUrl?.replace(/^https?:\/\//, '') || 'civilsansad.com'}
        </footer>
      </article>
    </div>
  );
}

export default function PrintPaperPage({ admin }: { admin?: boolean }) {
  const { slug = '', id = '' } = useParams();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: admin ? ['admin', 'paper', id] : ['paper', slug],
    queryFn: () => (admin ? adminApi.testPaper(id) : testSeriesApi.paper(slug)),
  });
  const backTo = admin ? `/admin/tests/${id}` : `/tests/${slug}`;

  if (isLoading) return <Loader fullScreen label="Preparing the question paper..." />;
  if (error || !data)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState error={error} onRetry={() => refetch()} title="Question paper not available" />
        <div className="mt-4 text-center">
          <Link to={backTo} className="text-sm font-semibold text-brand-700 hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  return <PaperView paper={data} backTo={backTo} />;
}
