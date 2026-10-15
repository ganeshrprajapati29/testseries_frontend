import type { AnswerState, ExamQuestion, Language, OptionKey } from '@/types';
import type { PaletteStatus, PendingAnswer } from './examination.types';

export function paletteStatus(a?: Pick<AnswerState, 'selectedOption' | 'markedForReview' | 'visited'>): PaletteStatus {
  if (!a) return 'not-visited';
  const answered = !!a.selectedOption;
  if (answered && a.markedForReview) return 'answered-marked';
  if (a.markedForReview) return 'marked';
  if (answered) return 'answered';
  if (a.visited) return 'not-answered';
  return 'not-visited';
}

export function countStatuses(answers: Record<string, AnswerState>, questionIds: string[]) {
  const counts: Record<PaletteStatus, number> = { 'not-visited': 0, 'not-answered': 0, answered: 0, marked: 0, 'answered-marked': 0 };
  for (const id of questionIds) counts[paletteStatus(answers[id])] += 1;
  return counts;
}

/** Text of a question in the chosen language, falling back to the original. */
export function localize(q: ExamQuestion, lang: Language) {
  const t = q.translations.find((tr) => tr.language === lang);
  if (!t) return { questionText: q.questionText, optionText: (key: OptionKey) => q.options.find((o) => o.key === key)?.text ?? '' };
  return {
    questionText: t.questionText,
    optionText: (key: OptionKey) => t.options.find((o) => o.key === key)?.text || q.options.find((o) => o.key === key)?.text || '',
  };
}

/** Merges queued updates for the same question so only the latest state is sent. */
export function mergePending(queue: PendingAnswer[]): PendingAnswer[] {
  const byId = new Map<string, PendingAnswer>();
  for (const item of queue) {
    const prev = byId.get(item.questionId);
    byId.set(item.questionId, prev ? { ...prev, ...item, timeSpentDelta: Math.min(3600, prev.timeSpentDelta + item.timeSpentDelta) } : { ...item });
  }
  return [...byId.values()];
}

export const PALETTE_STYLES: Record<PaletteStatus, string> = {
  'not-visited': 'bg-white text-slate-600 border-slate-300',
  'not-answered': 'bg-red-500 text-white border-red-500',
  answered: 'bg-emerald-500 text-white border-emerald-500',
  marked: 'bg-violet-500 text-white border-violet-500',
  'answered-marked': 'bg-violet-500 text-white border-violet-500 ring-2 ring-emerald-400 ring-offset-1',
};

export const PALETTE_LABELS: Record<PaletteStatus, string> = {
  answered: 'Answered',
  'not-answered': 'Not answered',
  'not-visited': 'Not visited',
  marked: 'Marked for review',
  'answered-marked': 'Answered & marked',
};
