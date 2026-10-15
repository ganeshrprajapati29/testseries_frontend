import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, Clock, Crosshair, FileCheck2, PlayCircle, Target, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { examUrl, resultUrl, ROUTES, seriesUrl } from '@/app/constants';
import { StatCard } from '@/components/admin/StatCard';
import { PageHeader } from '@/components/common/Badge';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { formatDateTime, formatDuration, formatNumber, formatScore } from '@/lib/formatters';
import { studentApi } from '../student.api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'dashboard'], queryFn: studentApi.dashboard });

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader title={`Hello, ${user?.name.split(' ')[0] ?? 'there'}!`} description="Here is a summary of your preparation." actions={<ButtonLink to={ROUTES.testSeries}>Find new tests</ButtonLink>} />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton count={4} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FileCheck2} label="Tests taken" value={formatNumber(data.stats.testsTaken)} tone="blue" />
            <StatCard icon={Target} label="Average score" value={`${formatScore(data.stats.averagePercentage)}%`} hint={`Best ${formatScore(data.stats.bestPercentage)}%`} tone="orange" />
            <StatCard icon={Crosshair} label="Accuracy" value={`${formatScore(data.stats.averageAccuracy)}%`} hint={`${formatNumber(data.stats.correctAnswers)} correct of ${formatNumber(data.stats.questionsAttempted)}`} tone="green" />
            <StatCard icon={Clock} label="Time practised" value={formatDuration(data.stats.timeSpentSeconds)} tone="purple" />
          </div>

          {data.inProgress.length > 0 && (
            <section className="card border-accent-200 bg-accent-50/50 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-accent-800">
                <PlayCircle className="h-5 w-5" /> Continue where you left off
              </h2>
              <ul className="space-y-2">
                {data.inProgress.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-4 py-3">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-slate-500">Time ends {formatDateTime(a.deadlineAt)}</p>
                    </div>
                    <ButtonLink to={examUrl(a.id)} size="sm" variant="accent">
                      Resume
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Trophy className="h-4 w-4 text-accent-500" /> Recent results
                </h2>
                <Link to={ROUTES.myResults} className="text-sm font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              </div>
              {data.recentResults.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.recentResults.map((r) => (
                    <li key={r._id}>
                      <Link to={resultUrl(r.attemptId)} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.testTitle}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(r.evaluatedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatScore(r.totalScore)}/{formatScore(r.maximumMarks)}
                          </p>
                          <p className="text-xs text-slate-500">{formatScore(r.percentage)}%</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No results yet" message="Attempt a test to see your performance here." className="rounded-none border-0" />
              )}
            </section>

            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <BookOpenCheck className="h-4 w-4 text-brand-600" /> My test series
                </h2>
                <Link to={ROUTES.myTests} className="text-sm font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              </div>
              {data.enrollments.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.enrollments.slice(0, 6).map((e) => {
                    const pct = e.totalTests ? Math.round((e.completedTests / e.totalTests) * 100) : 0;
                    return (
                      <li key={e._id}>
                        <Link to={seriesUrl(e.series.slug)} className="block px-5 py-3 hover:bg-slate-50">
                          <div className="flex justify-between gap-3">
                            <p className="truncate font-medium">{e.series.title}</p>
                            <span className="shrink-0 text-xs text-slate-500">
                              {e.completedTests}/{e.totalTests} tests
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState title="No test series yet" message="Add a free series or purchase one to start practising." action={<ButtonLink to={ROUTES.testSeries} size="sm">Browse test series</ButtonLink>} className="rounded-none border-0" />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
