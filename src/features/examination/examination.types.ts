export type { AnswerState, AttemptSummary, ExamPayload, ExamQuestion, ResultData, SolutionQuestion, SolutionsData } from '@/types';

export type PaletteStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';

export interface PendingAnswer {
  questionId: string;
  selectedOption?: string | null;
  markedForReview?: boolean;
  visited?: boolean;
  timeSpentDelta: number;
}
