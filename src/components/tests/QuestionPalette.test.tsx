import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuestionPalette } from './QuestionPalette';

describe('QuestionPalette', () => {
  it('shows a button per question with its status and jumps on click', async () => {
    const onJump = vi.fn();
    render(
      <QuestionPalette
        questionIds={['a', 'b', 'c']}
        current={0}
        onJump={onJump}
        answers={{
          a: { questionId: 'a', selectedOption: 'A', markedForReview: false, visited: true, timeSpentSeconds: 3 },
          b: { questionId: 'b', selectedOption: null, markedForReview: true, visited: true, timeSpentSeconds: 0 },
          c: { questionId: 'c', selectedOption: null, markedForReview: false, visited: false, timeSpentSeconds: 0 },
        }}
      />,
    );
    expect(screen.getByRole('listitem', { name: 'Question 1, Answered' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('listitem', { name: 'Question 2, Marked for review' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Question 3, Not visited' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('listitem', { name: 'Question 3, Not visited' }));
    expect(onJump).toHaveBeenCalledWith(2);
  });
});
