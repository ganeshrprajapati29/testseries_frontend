import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { TableSkeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/common/Badge';
import { adminApi } from '../admin.api';
import { useAdminMutation } from '../hooks/useAdminMutation';

/** Select questions from the bank and append them to a test. */
export function QuestionPicker({ open, onClose, testId }: { open: boolean; onClose: () => void; testId: string }) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const facets = useQuery({ queryKey: ['admin', 'question-facets'], queryFn: adminApi.questionFacets, enabled: open });
  const params = { page, limit: 15, search, subject, difficulty, excludeTestId: testId };
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'questions', 'picker', params], queryFn: () => adminApi.questions(params), enabled: open, placeholderData: (p) => p });

  const add = useAdminMutation(() => adminApi.addTestQuestions(testId, [...selected]), {
    success: (r) => `${r.added} question(s) added`,
    onSuccess: () => {
      setSelected(new Set());
      onClose();
    },
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageIds = data?.items.map((q) => q._id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Add questions from the bank"
      description="Questions already in this test are hidden."
      footer={
        <>
          <span className="mr-auto text-sm text-slate-500">{selected.size} selected</span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selected.size} loading={add.isPending} onClick={() => add.mutate()}>
            Add {selected.size || ''} question(s)
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search question text..."
          className="flex-1"
        />
        <select className="field sm:w-44" value={subject} onChange={(e) => (setSubject(e.target.value), setPage(1))} aria-label="Subject">
          <option value="">All subjects</option>
          {facets.data?.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="field sm:w-36" value={difficulty} onChange={(e) => (setDifficulty(e.target.value), setPage(1))} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      {isLoading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : !data?.items.length ? (
        <p className="py-10 text-center text-sm text-slate-500">No matching questions. Create new ones or import a spreadsheet.</p>
      ) : (
        <>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="accent-brand-600"
              checked={allSelected}
              onChange={() =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
                  return next;
                })
              }
            />
            Select all on this page
          </label>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {data.items.map((q) => (
              <li key={q._id}>
                <label className="flex cursor-pointer gap-3 p-3 hover:bg-slate-50">
                  <input type="checkbox" className="mt-1 accent-brand-600" checked={selected.has(q._id)} onChange={() => toggle(q._id)} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-slate-800">{q.questionText}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {q.subject && <Badge tone="blue">{q.subject}</Badge>}
                      {q.topic && <Badge>{q.topic}</Badge>}
                      <Badge tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'easy' ? 'green' : 'amber'}>{q.difficulty}</Badge>
                      {q.sourceYear && <Badge tone="orange">{q.sourceExam} {q.sourceYear}</Badge>}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          <Pagination meta={data.meta} onPageChange={setPage} className="mt-3" />
        </>
      )}
    </Modal>
  );
}
