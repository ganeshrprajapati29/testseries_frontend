import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, PlayCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { examUrl, testUrl } from '@/app/constants';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Checkbox } from '@/components/common/Input';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { Loader } from '@/components/common/Loader';
import { TestInstructions } from '@/components/tests/TestInstructions';
import { useAuth } from '@/features/auth/useAuth';
import { testSeriesApi } from '@/features/test-series/testSeries.api';
import { useSettings } from '@/hooks/useSettings';
import { errorMessage } from '@/services/apiClient';
import type { Language } from '@/types';
import { examinationApi } from '../examination.api';

export default function ExamInstructionsPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [language, setLanguage] = useState<Language | null>(null);

  const { data: test, isLoading, error, refetch } = useQuery({ queryKey: ['test', slug, user?.id], queryFn: () => testSeriesApi.test(slug) });

  const start = useMutation({
    mutationFn: () => examinationApi.start(test!._id, language ?? (user?.preferredLanguage && test!.languageOptions.includes(user.preferredLanguage) ? user.preferredLanguage : test!.languageOptions[0])),
    onSuccess: ({ attemptId }) => navigate(examUrl(attemptId), { replace: true }),
  });

  if (isLoading) return <Loader fullScreen />;
  if (error || !test)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Test not available" />
      </div>
    );

  if (!test.hasAccess) return <Navigate to={testUrl(test.slug)} replace />;

  const resuming = !!test.inProgressAttemptId;
  const blocked = !resuming && (test.availability !== 'OPEN' || test.attemptsLeft === 0);
  const currentLang = language ?? (user?.preferredLanguage && test.languageOptions.includes(user.preferredLanguage) ? user.preferredLanguage : test.languageOptions[0]!);

  return (
    <div className="container-page max-w-4xl py-8">
      <Link to={testUrl(test.slug)} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to test details
      </Link>
      <div className="card p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">Instructions</p>
        <h1 className="mt-1 text-2xl font-bold">{test.title}</h1>
        {test.hi?.title && (
          <p lang="hi" className="text-slate-600">
            {test.hi.title}
          </p>
        )}
        <div className="mt-6">
          <TestInstructions test={test} generalInstructions={settings?.defaultExamInstructions} />
        </div>

        <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
          {test.languageOptions.length > 1 && !resuming && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Default question language:</span>
              <LanguageSelector value={currentLang} options={test.languageOptions} onChange={setLanguage} />
            </div>
          )}
          <Checkbox
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            label="I have read and understood the instructions."
            description="I agree not to use any unfair means and I understand the timer cannot be paused once the test starts."
          />
          {start.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage(start.error)}
            </p>
          )}
          {blocked ? (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
              {test.availability === 'UPCOMING' ? 'This test has not started yet.' : test.availability === 'CLOSED' ? 'This test is closed.' : 'You have used all attempts for this test.'}
            </p>
          ) : (
            <Button size="lg" variant={resuming ? 'accent' : 'primary'} disabled={!agreed} loading={start.isPending} onClick={() => start.mutate()} icon={resuming ? <RotateCcw className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}>
              {resuming ? 'Resume test' : 'I am ready to begin'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
