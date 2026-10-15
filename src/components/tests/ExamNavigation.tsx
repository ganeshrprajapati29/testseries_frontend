import { Bookmark, ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import { Button } from '../common/Button';

interface ExamNavigationProps {
  isFirst: boolean;
  isLast: boolean;
  hasAnswer: boolean;
  isMarked: boolean;
  onPrevious: () => void;
  onSaveNext: () => void;
  onMarkReviewNext: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ExamNavigation({ isFirst, isLast, hasAnswer, isMarked, onPrevious, onSaveNext, onMarkReviewNext, onClear, disabled }: ExamNavigationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onMarkReviewNext} disabled={disabled} icon={<Bookmark className="h-4 w-4" />} className={isMarked ? 'border-violet-400 text-violet-700' : ''}>
          {isMarked ? 'Unmark' : 'Mark for Review'} {!isLast && '& Next'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled || !hasAnswer} icon={<Eraser className="h-4 w-4" />}>
          Clear Response
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={disabled || isFirst} icon={<ChevronLeft className="h-4 w-4" />}>
          Previous
        </Button>
        <Button size="sm" onClick={onSaveNext} disabled={disabled || isLast}>
          Save & Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
