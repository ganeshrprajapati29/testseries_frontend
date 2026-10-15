import { describe, expect, it } from 'vitest';
import type { AnswerState, ExamQuestion } from '@/types';
import { countStatuses, localize, mergePending, paletteStatus } from './examination.utils';

const base: AnswerState = { questionId: 'q1', selectedOption: null, markedForReview: false, visited: false, timeSpentSeconds: 0 };

describe('paletteStatus', () => {
  it('derives the palette colour state', () => {
    expect(paletteStatus(undefined)).toBe('not-visited');
    expect(paletteStatus(base)).toBe('not-visited');
    expect(paletteStatus({ ...base, visited: true })).toBe('not-answered');
    expect(paletteStatus({ ...base, visited: true, selectedOption: 'A' })).toBe('answered');
    expect(paletteStatus({ ...base, markedForReview: true })).toBe('marked');
    expect(paletteStatus({ ...base, markedForReview: true, selectedOption: 'B' })).toBe('answered-marked');
  });

  it('counts statuses across questions', () => {
    const answers = {
      q1: { ...base, questionId: 'q1', visited: true, selectedOption: 'A' as const },
      q2: { ...base, questionId: 'q2', visited: true },
      q3: { ...base, questionId: 'q3' },
    };
    expect(countStatuses(answers, ['q1', 'q2', 'q3'])).toMatchObject({ answered: 1, 'not-answered': 1, 'not-visited': 1 });
  });
});

describe('mergePending', () => {
  it('keeps the latest answer per question and sums time', () => {
    const merged = mergePending([
      { questionId: 'q1', selectedOption: 'A', timeSpentDelta: 5 },
      { questionId: 'q2', visited: true, timeSpentDelta: 0 },
      { questionId: 'q1', selectedOption: 'C', timeSpentDelta: 7 },
      { questionId: 'q1', markedForReview: true, timeSpentDelta: 0 },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.questionId === 'q1')).toEqual({ questionId: 'q1', selectedOption: 'C', markedForReview: true, timeSpentDelta: 12 });
  });

  it('preserves an explicit clear (null) answer', () => {
    const merged = mergePending([
      { questionId: 'q1', selectedOption: 'A', timeSpentDelta: 0 },
      { questionId: 'q1', selectedOption: null, timeSpentDelta: 0 },
    ]);
    expect(merged[0]!.selectedOption).toBeNull();
  });
});

describe('localize', () => {
  const q: ExamQuestion = {
    id: '1',
    questionText: 'Capital of India?',
    imageUrl: '',
    subject: '',
    topic: '',
    options: [
      { key: 'A', text: 'Delhi', imageUrl: '' },
      { key: 'B', text: 'Mumbai', imageUrl: '' },
    ],
    translations: [{ language: 'hi', questionText: 'भारत की राजधानी?', options: [{ key: 'A', text: 'दिल्ली' }] }],
  };

  it('uses the translation and falls back to the original option text', () => {
    const hi = localize(q, 'hi');
    expect(hi.questionText).toBe('भारत की राजधानी?');
    expect(hi.optionText('A')).toBe('दिल्ली');
    expect(hi.optionText('B')).toBe('Mumbai');
    expect(localize(q, 'en').questionText).toBe('Capital of India?');
  });
});
