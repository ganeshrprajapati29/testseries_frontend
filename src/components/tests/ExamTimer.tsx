import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatClock } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  /** Deadline as an absolute timestamp from the server. */
  deadlineAt: string;
  /** serverNow - clientNow at load time, so the countdown follows the server clock. */
  clockOffsetMs: number;
  onExpire: () => void;
  onTick?: (remainingSeconds: number) => void;
}

export function remainingSecondsFor(deadlineAt: string, clockOffsetMs: number) {
  return Math.max(0, Math.floor((new Date(deadlineAt).getTime() - (Date.now() + clockOffsetMs)) / 1000));
}

export function ExamTimer({ deadlineAt, clockOffsetMs, onExpire, onTick }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(() => remainingSecondsFor(deadlineAt, clockOffsetMs));
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);
  onExpireRef.current = onExpire;
  onTickRef.current = onTick;

  useEffect(() => {
    const tick = () => {
      const r = remainingSecondsFor(deadlineAt, clockOffsetMs);
      setRemaining(r);
      onTickRef.current?.(r);
      if (r <= 0 && !expired.current) {
        expired.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineAt, clockOffsetMs]);

  const critical = remaining <= 60;
  const warning = remaining <= 300;

  return (
    <div
      role="timer"
      aria-live={critical ? 'assertive' : 'off'}
      aria-label={`Time left ${formatClock(remaining)}`}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums',
        critical ? 'animate-pulse bg-red-600 text-white' : warning ? 'bg-amber-100 text-amber-800' : 'bg-slate-900 text-white',
      )}
    >
      <Clock className="h-5 w-5" aria-hidden />
      {formatClock(remaining)}
    </div>
  );
}
