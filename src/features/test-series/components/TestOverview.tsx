import { CalendarClock, Clock, Download, Eye, FileQuestion, FileText, Lock, MinusCircle, PlayCircle, Printer, RotateCcw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { instructionsUrl, resultUrl, ROUTES, seriesUrl } from '@/app/constants';
import { Badge } from '@/components/common/Badge';
import { buttonClasses, ButtonLink } from '@/components/common/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useAuth } from '@/features/auth/useAuth';
import { formatDateTime, formatDuration, formatScore, TEST_TYPE_LABELS } from '@/lib/formatters';
import type { TestDetail } from '@/types';
import { testSeriesApi } from '../testSeries.api';

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Question paper / solutions PDFs and the printable paper (Testbook-style "Download PDF"). */
function PaperDownloads({ test }: { test: TestDetail }) {
  const { user, isAdmin } = useAuth();
  const qp = test.pdfs?.questionPaper;
  const sol = test.pdfs?.solutions;
  if (isAdmin) return null;
  if (!qp && !sol && !test.canViewPaper && !user) return null;

  const row = (label: string, file: { fileName: string; size: number; canDownload: boolean }, kind: 'question-paper' | 'solutions', lockedText: string) => (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-slate-500">
          {file.fileName} • {fileSize(file.size)}
        </p>
      </div>
      {file.canDownload ? (
        <div className="flex gap-2">
          <a href={testSeriesApi.pdfUrl(test.slug, kind)} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline', 'sm')}>
            <Eye className="h-3.5 w-3.5" /> View
          </a>
          <a href={testSeriesApi.pdfUrl(test.slug, kind, true)} className={buttonClasses('primary', 'sm')}>
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <Lock className="h-3.5 w-3.5" /> {lockedText}
        </span>
      )}
    </li>
  );

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <FileText className="h-4 w-4 text-red-600" /> Question paper & solutions
      </h2>
      <ul className="divide-y divide-slate-100">
        {qp && row('Question paper PDF', qp, 'question-paper', user ? 'Unlock the test to download' : 'Login to download')}
        {sol && row('Solutions PDF', sol, 'solutions', test.paperLockedReason || 'Available after you submit')}
        <li className="flex flex-wrap items-center gap-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Printer className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Printable paper with answer key</p>
            <p className="text-xs text-slate-500">{test.canViewPaper ? 'View, print or save as PDF (with figures and Hindi).' : test.paperLockedReason || 'Sign in to view.'}</p>
          </div>
          {test.canViewPaper ? (
            <Link to={`/tests/${test.slug}/paper`} className={buttonClasses('secondary', 'sm')}>
              <Printer className="h-3.5 w-3.5" /> Open paper
            </Link>
          ) : (
            <Lock className="h-4 w-4 text-slate-400" />
          )}
        </li>
      </ul>
    </div>
  );
}

/** Shared by the Test detail page and the PYQ paper page. */
export function TestOverview({ test }: { test: TestDetail }) {
  const { user, isAdmin } = useAuth();
  const facts = [
    { icon: FileQuestion, label: 'Questions', value: test.questionCount },
    { icon: Trophy, label: 'Total marks', value: formatScore(test.totalMarks) },
    { icon: Clock, label: 'Duration', value: formatDuration(test.durationSeconds) },
    { icon: MinusCircle, label: 'Negative marks', value: test.negativeMarks ? `-${formatScore(test.negativeMarks)}` : 'None' },
  ];
  const completed = test.myAttempts.filter((a) => a.status !== 'IN_PROGRESS');

  let cta;
  if (isAdmin) cta = <p className="text-sm text-slate-500">Administrators can preview tests from the admin panel.</p>;
  else if (!user)
    cta = (
      <ButtonLink to={`${ROUTES.login}?from=${encodeURIComponent(instructionsUrl(test.slug))}`} size="lg" className="w-full">
        Login to attempt
      </ButtonLink>
    );
  else if (!test.hasAccess)
    cta = test.series ? (
      <ButtonLink to={seriesUrl(test.series.slug)} size="lg" variant="accent" className="w-full" icon={<Lock className="h-4 w-4" />}>
        Unlock with {test.series.title}
      </ButtonLink>
    ) : null;
  else if (test.inProgressAttemptId)
    cta = (
      <ButtonLink to={instructionsUrl(test.slug)} size="lg" variant="accent" className="w-full" icon={<RotateCcw className="h-4 w-4" />}>
        Resume test
      </ButtonLink>
    );
  else if (test.availability === 'UPCOMING') cta = <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">This test opens on {formatDateTime(test.availableFrom)}.</p>;
  else if (test.availability === 'CLOSED') cta = <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">This test closed on {formatDateTime(test.availableUntil)}.</p>;
  else if (test.attemptsLeft === 0) cta = <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">You have used all attempts for this test.</p>;
  else
    cta = (
      <ButtonLink to={instructionsUrl(test.slug)} size="lg" className="w-full" icon={<PlayCircle className="h-5 w-5" />}>
        {completed.length ? 'Reattempt test' : 'Start test'}
      </ButtonLink>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{TEST_TYPE_LABELS[test.testType] ?? test.testType}</Badge>
            {test.paperYear && <Badge tone="orange">{test.paperYear}</Badge>}
            {test.isFree && <Badge tone="green">Free</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold">{test.title}</h1>
          {test.hi?.title && (
            <p lang="hi" className="mt-1 text-lg text-slate-600">
              {test.hi.title}
            </p>
          )}
          {test.series && (
            <p className="mt-1 text-sm text-slate-500">
              Part of{' '}
              <Link to={seriesUrl(test.series.slug)} className="font-medium text-brand-700 hover:underline">
                {test.series.title}
              </Link>
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4">
              <Icon className="h-5 w-5 text-brand-600" />
              <p className="mt-2 text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
        {test.description && (
          <div className="card p-5">
            <h2 className="mb-2 font-semibold">About this test</h2>
            <p className="prose-text text-sm">{test.description}</p>
          </div>
        )}
        <PaperDownloads test={test} />
        {completed.length > 0 && (
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-3 font-semibold">Your attempts</h2>
            <ul className="divide-y divide-slate-100">
              {completed.map((a) => (
                <li key={a._id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    Attempt {a.attemptNumber} <span className="text-slate-400">• {formatDateTime(a.submittedAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <Link to={resultUrl(a._id)} className="font-semibold text-brand-700 hover:underline">
                      View result
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4 p-5">
          {cta}
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex justify-between">
              <span>Attempts allowed</span>
              <b>{test.maxAttempts === 0 ? 'Unlimited' : test.maxAttempts}</b>
            </li>
            {user && (
              <li className="flex justify-between">
                <span>Attempts used</span>
                <b>{test.attemptsUsed}</b>
              </li>
            )}
            <li className="flex justify-between">
              <span>Languages</span>
              <b>{test.languageOptions.map((l) => (l === 'hi' ? 'Hindi' : 'English')).join(', ')}</b>
            </li>
            {test.availableUntil && (
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" /> Available till
                </span>
                <b>{formatDateTime(test.availableUntil)}</b>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
