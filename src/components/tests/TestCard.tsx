import { CalendarClock, Clock, FileQuestion, Lock, PlayCircle, RotateCcw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { instructionsUrl, resultUrl, testUrl } from '@/app/constants';
import { formatDateTime, formatDuration, formatScore, TEST_TYPE_LABELS } from '@/lib/formatters';
import type { SeriesTest } from '@/types';
import { Badge } from '../common/Badge';
import { buttonClasses } from '../common/Button';

function availability(t: SeriesTest) {
  const now = Date.now();
  if (t.availableFrom && new Date(t.availableFrom).getTime() > now) return 'upcoming';
  if (t.availableUntil && new Date(t.availableUntil).getTime() < now) return 'closed';
  return 'open';
}

export function TestCard({ test, isLoggedIn }: { test: SeriesTest; isLoggedIn: boolean }) {
  const state = availability(test);
  const { attempts, inProgressAttemptId, lastAttemptId } = test.myAttempts;
  const attemptsLeft = test.maxAttempts === 0 ? Infinity : test.maxAttempts - (attempts - (inProgressAttemptId ? 1 : 0));

  let action;
  if (test.locked) {
    action = (
      <Link to={testUrl(test.slug)} className={buttonClasses('outline', 'sm')}>
        <Lock className="h-3.5 w-3.5" /> Unlock
      </Link>
    );
  } else if (inProgressAttemptId) {
    action = (
      <Link to={instructionsUrl(test.slug)} className={buttonClasses('accent', 'sm')}>
        <RotateCcw className="h-3.5 w-3.5" /> Resume
      </Link>
    );
  } else if (state === 'upcoming') {
    action = <span className="text-xs font-medium text-amber-700">Starts {formatDateTime(test.availableFrom)}</span>;
  } else if (state === 'closed') {
    action = lastAttemptId ? (
      <Link to={resultUrl(lastAttemptId)} className={buttonClasses('secondary', 'sm')}>
        <Trophy className="h-3.5 w-3.5" /> Result
      </Link>
    ) : (
      <span className="text-xs font-medium text-slate-500">Closed</span>
    );
  } else {
    action = (
      <div className="flex gap-2">
        {lastAttemptId && (
          <Link to={resultUrl(lastAttemptId)} className={buttonClasses('outline', 'sm')}>
            Result
          </Link>
        )}
        {attemptsLeft > 0 ? (
          <Link to={isLoggedIn ? instructionsUrl(test.slug) : testUrl(test.slug)} className={buttonClasses('primary', 'sm')}>
            <PlayCircle className="h-3.5 w-3.5" /> {lastAttemptId ? 'Reattempt' : 'Start'}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={testUrl(test.slug)} className="font-semibold text-slate-900 hover:text-brand-700">
            {test.title}
          </Link>
          {test.isFree && test.locked === false && <Badge tone="green">Free</Badge>}
          {test.locked && <Badge tone="orange">Paid</Badge>}
          <Badge tone="gray">{TEST_TYPE_LABELS[test.testType] ?? test.testType}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FileQuestion className="h-3.5 w-3.5" /> {test.questionCount} Qs
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" /> {formatScore(test.totalMarks)} marks
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(test.durationSeconds)}
          </span>
          {test.negativeMarks > 0 && <span className="text-red-500">-{formatScore(test.negativeMarks)} per wrong</span>}
          {test.availableUntil && state === 'open' && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> Till {formatDateTime(test.availableUntil)}
            </span>
          )}
          {attempts > 0 && <span className="text-brand-600">Attempted {attempts}x</span>}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
