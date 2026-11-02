import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Flag } from 'lucide-react';
import { useState } from 'react';
import { examinationApi } from '@/features/examination/examination.api';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/services/apiClient';
import type { MyQuestionReport, ReportReason } from '@/types';
import { Button } from '../common/Button';
import { Textarea } from '../common/Input';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  wrong_answer: 'Wrong answer / answer key',
  wrong_question: 'Question is incorrect or unclear',
  wrong_options: 'Options are wrong or repeated',
  typo: 'Spelling / typing mistake',
  translation: 'Hindi translation is wrong',
  image: 'Image missing or unclear',
  other: 'Something else',
};

/** The student's reports for an attempt, keyed by question id. */
export function useMyReports(attemptId: string, enabled = true) {
  const q = useQuery({ queryKey: ['student', 'reports', attemptId], queryFn: () => examinationApi.myReports(attemptId), enabled: enabled && !!attemptId, staleTime: 60_000 });
  const byQuestion = new Map((q.data ?? []).map((r) => [r.questionId, r]));
  return byQuestion;
}

const STATUS_TEXT: Record<MyQuestionReport['status'], string> = { open: 'Reported - under review', resolved: 'Report resolved', dismissed: 'Report reviewed' };

/** Small "Report" link that opens a dialog to report a mistake in a question. */
export function ReportQuestionButton({ attemptId, questionId, questionNumber, report, hideAnswerReason }: { attemptId: string; questionId: string; questionNumber: number; report?: MyQuestionReport; hideAnswerReason?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  const send = useMutation({
    mutationFn: () => examinationApi.reportQuestion(attemptId, { questionId, reason: reason as ReportReason, comment: comment.trim() }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['student', 'reports', attemptId] });
      toast.success(res.message ?? 'Thanks! Our team will review this question.');
      setOpen(false);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const closed = report && report.status !== 'open';
  const openDialog = () => {
    setReason(report?.reason ?? '');
    setComment(report?.comment ?? '');
    setError(null);
    setOpen(true);
  };
  const submit = () => {
    if (!reason) return setError('Select what is wrong with this question');
    if (reason === 'other' && comment.trim().length < 5) return setError('Please describe the problem');
    setError(null);
    send.mutate();
  };
  // During a test "wrong answer" is phrased neutrally - the student does not know the key yet.
  const reasons = (Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((r) => ({
    value: r,
    label: r === 'wrong_answer' && hideAnswerReason ? 'None of the options is correct' : REPORT_REASON_LABELS[r],
  }));

  return (
    <>
      {closed ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700" title={report.adminNote || undefined}>
          <CheckCircle2 className="h-3.5 w-3.5" /> {STATUS_TEXT[report.status]}
        </span>
      ) : (
        <button
          type="button"
          onClick={openDialog}
          className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium', report ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-100 hover:text-red-600')}
          aria-label={report ? `Question ${questionNumber} reported - edit report` : `Report a problem with question ${questionNumber}`}
        >
          <Flag className={cn('h-3.5 w-3.5', report && 'fill-amber-500 text-amber-600')} /> {report ? 'Reported' : 'Report'}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Report question ${questionNumber}`}
        description="Found a mistake? Tell us and our team will check and fix it."
        dismissible={!send.isPending}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={send.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} loading={send.isPending} icon={<Flag className="h-4 w-4" />}>
              {report ? 'Update report' : 'Send report'}
            </Button>
          </>
        }
      >
        <fieldset>
          <legend className="label">What is wrong?</legend>
          <div className="space-y-1.5">
            {reasons.map((r) => (
              <label key={r.value} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm', reason === r.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50')}>
                <input type="radio" name="report-reason" className="accent-brand-600" checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4">
          <Textarea
            label={reason === 'other' ? 'Describe the problem' : 'Details (optional)'}
            required={reason === 'other'}
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. The correct answer should be option C because..."
          />
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        {report && <p className="mt-2 text-xs text-slate-500">You reported this on {formatDate(report.reportedAt)}. Sending again updates your report.</p>}
      </Modal>
    </>
  );
}

/** Reply from the team under a solution, once the report was reviewed. */
export function ReportReply({ report }: { report?: MyQuestionReport }) {
  if (!report || report.status === 'open' || !report.adminNote) return null;
  return (
    <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      <span className="font-semibold">Reply to your report:</span> {report.adminNote}
    </div>
  );
}
