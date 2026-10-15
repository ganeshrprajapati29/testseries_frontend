import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, ClipboardList, FileQuestion, FolderTree, IndianRupee, Library, NotebookTabs, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/admin/StatCard';
import { PageHeader } from '@/components/common/Badge';
import { ButtonLink } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { formatCurrency, formatDateTime, formatNumber, formatScore } from '@/lib/formatters';
import { adminApi } from '../admin.api';

function AttemptsChart({ data }: { data: { date: string; attempts: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.attempts));
  const total = data.reduce((s, d) => s + d.attempts, 0);
  return (
    <figure>
      <figcaption className="mb-4 flex items-baseline justify-between">
        <span className="font-semibold">Test attempts - last 14 days</span>
        <span className="text-sm text-slate-500">{formatNumber(total)} total</span>
      </figcaption>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label={`Daily attempts over the last 14 days, ${total} in total`}>
        {data.map((d) => (
          <div key={d.date} className="group flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.attempts} attempts`}>
            <span className="mb-1 text-center text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100">{d.attempts}</span>
            <div className="rounded-t bg-brand-500 transition group-hover:bg-brand-600" style={{ height: `${Math.max(2, (d.attempts / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </figure>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Live overview of the Civil Sansad test platform."
        actions={
          <>
            <ButtonLink to="/admin/test-series?new=1" variant="outline" icon={<Plus className="h-4 w-4" />}>
              New series
            </ButtonLink>
            <ButtonLink to="/admin/questions?new=1" icon={<Plus className="h-4 w-4" />}>
              New question
            </ButtonLink>
          </>
        }
      />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton count={8} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Students" value={formatNumber(data.counts.students)} hint={`+${data.counts.newStudents30d} in 30 days`} />
            <StatCard icon={Library} label="Test series" value={formatNumber(data.counts.series)} hint={`${data.counts.publishedSeries} published`} tone="orange" />
            <StatCard icon={ClipboardList} label="Tests" value={formatNumber(data.counts.tests)} hint={`${data.counts.publishedTests} published (incl. PYQs)`} tone="purple" />
            <StatCard icon={NotebookTabs} label="PYQ papers" value={formatNumber(data.counts.pyqPapers)} tone="green" />
            <StatCard icon={FileQuestion} label="Active questions" value={formatNumber(data.counts.questions)} tone="slate" />
            <StatCard icon={Activity} label="Attempts" value={formatNumber(data.counts.attempts)} hint={`${data.counts.activeAttempts} running now`} />
            <StatCard icon={BarChart3} label="Results (30 days)" value={formatNumber(data.counts.results30d)} hint={`Avg ${formatScore(data.counts.averagePercentage30d)}%`} tone="orange" />
            <StatCard icon={IndianRupee} label="Revenue" value={formatCurrency(data.counts.revenueInPaise, true)} hint={`${data.counts.paidOrders} paid orders`} tone="green" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="card p-5">
              <AttemptsChart data={data.attemptsByDay} />
            </div>
            <div className="card overflow-hidden">
              <h2 className="border-b border-slate-100 px-5 py-3 font-semibold">Most attempted tests</h2>
              {data.topTests.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.topTests.map((t) => (
                    <li key={t.testId} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <Link to={`/admin/tests/${t.testId}`} className="truncate font-medium hover:text-brand-700">
                        {t.title}
                      </Link>
                      <span className="shrink-0 text-slate-500">
                        {t.attempts} • {formatScore(t.averagePercentage)}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No attempts yet.</p>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="font-semibold">Latest results</h2>
              <Link to="/admin/results" className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            </div>
            {data.recentResults.length ? (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentResults.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <p className="font-medium">{r.studentId?.name ?? 'Deleted user'}</p>
                          <p className="text-xs text-slate-500">{r.studentId?.email}</p>
                        </td>
                        <td>{r.testTitle}</td>
                        <td className="font-semibold">
                          {formatScore(r.totalScore)}/{formatScore(r.maximumMarks)}
                        </td>
                        <td>{formatScore(r.accuracy)}%</td>
                        <td className="text-slate-500">{formatDateTime(r.evaluatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No results yet.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { to: '/admin/categories', icon: FolderTree, label: 'Manage categories', text: `${data.counts.categories} categories` },
              { to: '/admin/imports', icon: FileQuestion, label: 'Bulk import questions', text: 'CSV or Excel upload' },
              { to: '/admin/pyqs', icon: NotebookTabs, label: 'Manage PYQs', text: 'Exams, subjects & papers' },
            ].map(({ to, icon: Icon, label, text }) => (
              <Link key={to} to={to} className="card flex items-center gap-3 p-4 hover:border-brand-300">
                <Icon className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-slate-500">{text}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
