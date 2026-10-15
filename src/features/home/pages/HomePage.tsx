import { ArrowRight, BarChart3, BookOpenCheck, CheckCircle2, Clock, FileQuestion, Languages, Library, NotebookTabs, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pyqExamUrl, ROUTES } from '@/app/constants';
import { ButtonLink } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton, Skeleton } from '@/components/common/Skeleton';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { TestSeriesCard } from '@/components/tests/TestSeriesCard';
import { useAuth } from '@/features/auth/useAuth';
import { useCategoryTree } from '@/features/categories/categories.api';
import { pyqsApi } from '@/features/pyqs/pyqs.api';
import { useSettings } from '@/hooks/useSettings';
import { formatNumber } from '@/lib/formatters';
import { useHomeData } from '../home.api';

const FEATURES = [
  { icon: Clock, title: 'Real exam interface', text: 'Server-synced timer, question palette, mark for review and auto-submit - just like the actual exam.' },
  { icon: BarChart3, title: 'Instant result & rank', text: 'Score, accuracy, percentile, rank and subject-wise analysis right after you submit.' },
  { icon: CheckCircle2, title: 'Detailed solutions', text: 'Answer key with explanations for every question so you learn from each attempt.' },
  { icon: Languages, title: 'English & Hindi', text: 'Bilingual tests where available - switch language any time during the exam.' },
];

export default function HomePage() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const home = useHomeData();
  const tree = useCategoryTree('TEST_SERIES');
  const pyqs = useQuery({ queryKey: ['pyqs', 'home'], queryFn: pyqsApi.home });

  const stats = home.data?.stats;
  const statItems = stats
    ? [
        { label: 'Test series', value: stats.seriesCount, icon: Library },
        { label: 'Mock tests', value: stats.testCount, icon: BookOpenCheck },
        { label: 'PYQ papers', value: stats.pyqPaperCount, icon: NotebookTabs },
        { label: 'Questions', value: stats.questionCount, icon: FileQuestion },
      ]
    : [];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-50 ring-1 ring-white/20">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-300" /> {settings?.tagline || 'Achieving Excellence Together'}
            </p>
            {settings ? (
              <>
                <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">{settings.heroTitle}</h1>
                <p className="mt-4 max-w-xl text-lg text-brand-100">{settings.heroSubtitle}</p>
              </>
            ) : (
              <div className="mt-5 space-y-3">
                <Skeleton className="h-12 w-full bg-white/20" />
                <Skeleton className="h-6 w-3/4 bg-white/20" />
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to={ROUTES.testSeries} size="lg" variant="accent" icon={<Library className="h-5 w-5" />}>
                Explore Test Series
              </ButtonLink>
              <ButtonLink to={ROUTES.pyqs} size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" icon={<NotebookTabs className="h-5 w-5" />}>
                Solve PYQs
              </ButtonLink>
            </div>
            {!user && (
              <p className="mt-4 text-sm text-brand-100">
                New here?{' '}
                <Link to={ROUTES.register} className="font-semibold text-white underline underline-offset-2">
                  Create a free account
                </Link>{' '}
                to save your progress.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {home.isLoading
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl bg-white/15" />)
              : statItems.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                    <Icon className="h-6 w-6 text-accent-300" aria-hidden />
                    <p className="mt-3 text-3xl font-extrabold">{formatNumber(value)}</p>
                    <p className="text-sm text-brand-100">{label}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Exam categories */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Choose your exam</h2>
            <p className="mt-1 text-slate-500">Test series organised exam-wise and subject-wise.</p>
          </div>
          <Link to={ROUTES.categories} className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:flex">
            All exams <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {tree.error ? <ErrorState error={tree.error} onRetry={() => tree.refetch()} /> : <CategoryGrid categories={tree.data} isLoading={tree.isLoading} />}
      </section>

      {/* Featured series */}
      <section className="bg-white py-14">
        <div className="container-page">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Popular test series</h2>
              <p className="mt-1 text-slate-500">Exam-pattern mock tests prepared by Civil Sansad mentors.</p>
            </div>
            <Link to={ROUTES.testSeries} className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {home.error ? (
            <ErrorState error={home.error} onRetry={() => home.refetch()} />
          ) : home.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton count={3} />
            </div>
          ) : home.data?.featured.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {home.data.featured.map((s) => (
                <TestSeriesCard key={s._id} series={s} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">New test series are being added. Please check back soon.</p>
          )}
        </div>
      </section>

      {/* PYQs */}
      <section className="container-page py-14">
        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Previous Year Questions</h2>
            <p className="mt-2 text-slate-500">Practise real exam papers subject-wise and year-wise with answer keys and explanations.</p>
            <ButtonLink to={ROUTES.pyqs} className="mt-5" icon={<NotebookTabs className="h-4 w-4" />}>
              Browse all PYQs
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {pyqs.isLoading ? (
              <CardSkeleton count={2} />
            ) : (
              pyqs.data?.map((exam) => (
                <CategoryCard key={exam._id} to={pyqExamUrl(exam.slug)} name={`${exam.name} PYQs`} slug={exam.slug} icon={exam.icon} subtitle={`${exam.children.length} subjects • ${exam.paperCount} papers`} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="bg-white py-14">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Why practise with Civil Sansad?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-14">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-white sm:flex-row sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Start your preparation today</h2>
            <p className="mt-1 text-accent-50">Attempt a free mock test and see where you stand.</p>
          </div>
          <ButtonLink to={user ? ROUTES.dashboard : ROUTES.register} size="lg" className="bg-white text-accent-600 hover:bg-accent-50">
            {user ? 'Go to dashboard' : 'Register for free'}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
