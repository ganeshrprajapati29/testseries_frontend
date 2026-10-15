import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import { examinationApi } from '../examination.api';
import type { PendingAnswer } from '../examination.types';
import { mergePending } from '../examination.utils';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline';

/**
 * Queues answer changes and sends them in batches. Failed saves stay in the queue and are
 * retried, so a flaky connection never loses an answer. `onClosed` fires when the server
 * reports the attempt is no longer accepting answers (time up / already submitted).
 */
export function useAnswerSync(attemptId: string, onClosed: () => void) {
  const queue = useRef<PendingAnswer[]>([]);
  const inflight = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pending, setPending] = useState(0);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const flush = useCallback(async (): Promise<void> => {
    if (inflight.current) {
      await inflight.current;
      if (!queue.current.length) return;
    }
    if (!queue.current.length) return;
    const batch = mergePending(queue.current);
    queue.current = [];
    setStatus('saving');
    const run = (async () => {
      try {
        // The API accepts at most 200 answers per request.
        for (let i = 0; i < batch.length; i += 200) {
          await examinationApi.saveAnswers(attemptId, batch.slice(i, i + 200));
        }
        setStatus(queue.current.length ? 'saving' : 'saved');
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setStatus('saved');
          onClosedRef.current();
          return;
        }
        // Put the batch back in front of anything queued meanwhile and retry later.
        queue.current = [...batch, ...queue.current];
        setStatus('offline');
      } finally {
        setPending(queue.current.length);
      }
    })();
    inflight.current = run;
    await run;
    inflight.current = null;
  }, [attemptId]);

  const enqueue = useCallback((item: PendingAnswer) => {
    queue.current.push(item);
    setPending(queue.current.length);
  }, []);

  // Periodic flush + retry.
  useEffect(() => {
    const id = setInterval(() => {
      void flush();
    }, 3000);
    const online = () => void flush();
    window.addEventListener('online', online);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', online);
    };
  }, [flush]);

  return useMemo(() => ({ enqueue, flush, status, pending }), [enqueue, flush, status, pending]);
}
