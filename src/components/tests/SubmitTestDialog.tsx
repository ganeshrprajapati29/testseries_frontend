import { countStatuses } from '@/features/examination/examination.utils';
import { formatClock } from '@/lib/formatters';
import type { AnswerState } from '@/types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface SubmitTestDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
  answers: Record<string, AnswerState>;
  questionIds: string[];
  remainingSeconds: number;
}

export function SubmitTestDialog({ open, onCancel, onConfirm, submitting, answers, questionIds, remainingSeconds }: SubmitTestDialogProps) {
  const c = countStatuses(answers, questionIds);
  const answered = c.answered + c['answered-marked'];
  const rows = [
    { label: 'Total questions', value: questionIds.length },
    { label: 'Answered', value: answered, cls: 'text-emerald-700' },
    { label: 'Not answered', value: c['not-answered'], cls: 'text-red-600' },
    { label: 'Marked for review (unanswered)', value: c.marked, cls: 'text-violet-700' },
    { label: 'Not visited', value: c['not-visited'], cls: 'text-slate-500' },
  ];
  return (
    <Modal
      open={open}
      onClose={onCancel}
      dismissible={!submitting}
      title="Submit test?"
      description={`Time remaining: ${formatClock(remainingSeconds)}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Back to test
          </Button>
          <Button variant="accent" onClick={onConfirm} loading={submitting}>
            Submit test
          </Button>
        </>
      }
    >
      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
            <dt className="text-slate-600">{r.label}</dt>
            <dd className={`font-bold ${r.cls ?? ''}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-slate-500">You will not be able to change your answers after submitting.</p>
    </Modal>
  );
}
