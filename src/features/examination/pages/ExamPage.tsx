import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, CloudOff, LayoutGrid, Loader2, Send, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { resultUrl, ROUTES } from '@/app/constants';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { Loader } from '@/components/common/Loader';
import { useToast } from '@/components/common/Toast';
import { ExamNavigation } from '@/components/tests/ExamNavigation';
import { ExamTimer, remainingSecondsFor } from '@/components/tests/ExamTimer';
import { QuestionCard } from '@/components/tests/QuestionCard';
import { QuestionPalette } from '@/components/tests/QuestionPalette';
import { SubmitTestDialog } from '@/components/tests/SubmitTestDialog';
import { useSettings } from '@/hooks/useSettings';
import { errorMessage } from '@/services/apiClient';
import type { AnswerState, Language, OptionKey } from '@/types';
import { examinationApi } from '../examination.api';
import { useAnswerSync } from '../hooks/useAnswerSync';

function SyncIndicator({ status }: { status: string }) {
  if (status === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
      </span>
    );
  if (status === 'offline')
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
        <CloudOff className="h-3.5 w-3.5" /> Offline - answers will sync
      </span>
    );
  if (status === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> All answers saved
      </span>
    );
  return null;
}

export default function ExamPage() {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { logoUrl } = useSettings();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exam', attemptId],
    queryFn: () => examinationApi.attempt(attemptId),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [index, setIndex] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const finishedRef = useRef(false);
  const enteredAt = useRef(Date.now());
  const clockOffset = useMemo(() => (data ? new Date(data.serverNow).getTime() - Date.now() : 0), [data]);

  const goToResult = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    qc.invalidateQueries({ queryKey: ['student'] });
    qc.invalidateQueries({ queryKey: ['test'] });
    qc.invalidateQueries({ queryKey: ['series'] });
    navigate(resultUrl(attemptId), { replace: true });
  }, [attemptId, navigate, qc]);

  const sync = useAnswerSync(attemptId, () => {
    toast.info('Time is up. Your test has been submitted.');
    goToResult();
  });

  // Initialise local state from the server once.
  useEffect(() => {
    if (!data || data.finished) return;
    setAnswers(Object.fromEntries(data.answers.map((a) => [a.questionId, a])));
    setLanguage(data.attempt.language);
    const firstUnanswered = data.questions.findIndex((q) => !data.answers.find((a) => a.questionId === q.id)?.visited);
    setIndex(firstUnanswered > 0 ? firstUnanswered : 0);
    setRemaining(data.remainingSeconds);
    enteredAt.current = Date.now();
  }, [data]);

  const questions = useMemo(() => data?.questions ?? [], [data]);
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const current = questions[index];
  const currentAnswer = current ? answers[current.id] : undefined;

  // Mark the current question as visited.
  useEffect(() => {
    if (!current) return;
    const a = answers[current.id];
    if (a && !a.visited) {
      setAnswers((prev) => ({ ...prev, [current.id]: { ...prev[current.id]!, visited: true } }));
      sync.enqueue({ questionId: current.id, visited: true, timeSpentDelta: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Warn before leaving the page while the test is running.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (finishedRef.current) return;
      void sync.flush();
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [sync]);

  /** Records time spent on the current question and moves to another one. */
  const goTo = useCallback(
    (next: number) => {
      if (!current) return;
      const delta = Math.round((Date.now() - enteredAt.current) / 1000);
      if (delta > 0) sync.enqueue({ questionId: current.id, timeSpentDelta: Math.min(delta, 3600) });
      enteredAt.current = Date.now();
      setIndex(Math.max(0, Math.min(questions.length - 1, next)));
      setPaletteOpen(false);
      void sync.flush();
    },
    [current, questions.length, sync],
  );

  const update = useCallback(
    (patch: Partial<AnswerState>) => {
      if (!current) return;
      setAnswers((prev) => ({ ...prev, [current.id]: { ...prev[current.id]!, ...patch, visited: true } }));
      sync.enqueue({
        questionId: current.id,
        ...(patch.selectedOption !== undefined ? { selectedOption: patch.selectedOption } : {}),
        ...(patch.markedForReview !== undefined ? { markedForReview: patch.markedForReview } : {}),
        visited: true,
        timeSpentDelta: 0,
      });
    },
    [current, sync],
  );

  const submit = useCallback(
    async (auto = false) => {
      if (finishedRef.current) return;
      setSubmitting(true);
      try {
        if (current) {
          const delta = Math.round((Date.now() - enteredAt.current) / 1000);
          if (delta > 0) sync.enqueue({ questionId: current.id, timeSpentDelta: Math.min(delta, 3600) });
        }
        await sync.flush();
        await examinationApi.submit(attemptId);
        if (auto) toast.info('Time is up! Your test was submitted automatically.');
        else toast.success('Test submitted successfully');
        goToResult();
      } catch (err) {
        toast.error(errorMessage(err));
        setSubmitting(false);
        // If time already ran out the server will auto-submit; show the result anyway.
        if (auto) goToResult();
      }
    },
    [attemptId, current, goToResult, sync, toast],
  );

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    examinationApi.setLanguage(attemptId, lang).catch(() => undefined);
  };

  if (isLoading) return <Loader fullScreen label="Loading your test..." />;
  if (error)
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => refetch()} title="Could not open this test" />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate(ROUTES.dashboard)}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  if (!data) return null;
  if (data.finished) return <Navigate to={resultUrl(attemptId)} replace />;
  if (!current) return <Loader fullScreen />;

  const { attempt } = data;
  const answeredCount = Object.values(answers).filter((a) => a.selectedOption).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logoUrl} alt="" className="hidden h-9 w-9 object-contain sm:block" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold sm:text-base">{attempt.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {answeredCount}/{questions.length} answered
                </span>
                <SyncIndicator status={sync.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExamTimer deadlineAt={attempt.deadlineAt} clockOffsetMs={clockOffset} onTick={setRemaining} onExpire={() => void submit(true)} />
            <Button variant="accent" size="sm" className="hidden sm:inline-flex" onClick={() => setShowSubmit(true)} disabled={submitting} icon={<Send className="h-4 w-4" />}>
              Submit
            </Button>
          </div>
        </div>
        {remaining > 0 && remaining <= 300 && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Less than {Math.ceil(remaining / 60)} minute(s) left. The test will be submitted automatically.
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-3 sm:p-4">
        {/* Question */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between gap-2">
            <LanguageSelector value={language} options={attempt.languageOptions} onChange={changeLanguage} />
            <button type="button" onClick={() => setPaletteOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium lg:hidden">
              <LayoutGrid className="h-4 w-4" /> Questions
            </button>
          </div>
          <div className="card flex-1 p-4 sm:p-6">
            <QuestionCard
              question={current}
              number={index + 1}
              total={questions.length}
              language={language}
              selected={currentAnswer?.selectedOption ?? null}
              onSelect={(key: OptionKey) => update({ selectedOption: key })}
              marksPerCorrect={attempt.marksPerCorrect}
              negativeMarks={attempt.negativeMarks}
              disabled={submitting}
            />
          </div>
          <div className="card mt-3 p-3">
            <ExamNavigation
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              hasAnswer={!!currentAnswer?.selectedOption}
              isMarked={!!currentAnswer?.markedForReview}
              disabled={submitting}
              onPrevious={() => goTo(index - 1)}
              onSaveNext={() => goTo(index + 1)}
              onClear={() => update({ selectedOption: null })}
              onMarkReviewNext={() => {
                update({ markedForReview: !currentAnswer?.markedForReview });
                if (index < questions.length - 1 && !currentAnswer?.markedForReview) goTo(index + 1);
              }}
            />
          </div>
          <Button variant="accent" size="lg" className="mt-3 w-full sm:hidden" onClick={() => setShowSubmit(true)} disabled={submitting} icon={<Send className="h-4 w-4" />}>
            Submit test
          </Button>
        </main>

        {/* Palette - desktop */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
            <h2 className="mb-3 text-sm font-semibold">Question palette</h2>
            <QuestionPalette questionIds={questionIds} answers={answers} current={index} onJump={goTo} />
          </div>
        </aside>
      </div>

      {/* Palette - mobile drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setPaletteOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Question palette</h2>
              <button type="button" onClick={() => setPaletteOpen(false)} aria-label="Close palette" className="rounded p-1 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <QuestionPalette questionIds={questionIds} answers={answers} current={index} onJump={goTo} />
          </div>
        </div>
      )}

      <SubmitTestDialog
        open={showSubmit}
        onCancel={() => setShowSubmit(false)}
        onConfirm={() => void submit(false)}
        submitting={submitting}
        answers={answers}
        questionIds={questionIds}
        remainingSeconds={remaining || remainingSecondsFor(attempt.deadlineAt, clockOffset)}
      />
    </div>
  );
}
