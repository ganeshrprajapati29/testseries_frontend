import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestEditor } from '@/components/admin/TestEditor';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';
import { adminApi } from '../admin.api';
import { CategoryManager } from './AdminCategoriesPage';
import { TestsTable } from './AdminTestsPage';

/**
 * PYQs = exams (root PYQ categories) -> subjects (child categories) -> papers (tests with a year).
 * Questions for each paper are managed on the paper page.
 */
export default function AdminPYQsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'papers' | 'structure'>('papers');
  const [creating, setCreating] = useState(false);
  const { get, setFilter } = usePagination();
  const tree = useQuery({ queryKey: ['admin', 'categories', 'PYQS'], queryFn: () => adminApi.categories('PYQS') });

  const examId = get('exam');
  const subjectId = get('subject');
  const exam = tree.data?.find((e) => e._id === examId);

  return (
    <div>
      <PageHeader
        title="PYQs"
        description="Manage previous year papers by exam, subject and year."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Add paper
          </Button>
        }
      />
      <div className="mb-4 inline-flex rounded-lg bg-white p-1 shadow-card">
        {(
          [
            ['papers', 'Papers'],
            ['structure', 'Exams & subjects'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={cn('rounded-md px-4 py-1.5 text-sm font-semibold', tab === key ? 'bg-brand-600 text-white' : 'text-slate-600')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'structure' ? (
        <CategoryManager moduleType="PYQS" />
      ) : (
        <>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:w-2/3">
            <select
              className="field"
              value={examId}
              onChange={(e) => {
                setFilter('subject', '');
                setFilter('exam', e.target.value);
              }}
              aria-label="Exam"
            >
              <option value="">All exams</option>
              {tree.data?.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
            <select className="field" value={subjectId} onChange={(e) => setFilter('subject', e.target.value)} disabled={!exam} aria-label="Subject">
              <option value="">All subjects</option>
              {exam?.children.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <TestsTable moduleType="PYQS" categoryId={subjectId || examId || undefined} onCreate={() => setCreating(true)} />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add PYQ paper" description="Choose the exam subject, year and marking scheme. You can add questions next." size="xl">
        <TestEditor moduleType="PYQS" defaultCategoryId={subjectId || undefined} onCancel={() => setCreating(false)} onSaved={(t) => navigate(`/admin/tests/${t._id}`)} />
      </Modal>
    </div>
  );
}
