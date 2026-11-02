import { useQuery } from '@tanstack/react-query';
import { Archive, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryEditor } from '@/components/admin/CategoryEditor';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { flattenTree } from '@/features/categories/categories.api';
import { cn } from '@/lib/utils';
import type { CategoryNode, ModuleType } from '@/types';
import { adminApi } from '../admin.api';
import { useAdminMutation } from '../hooks/useAdminMutation';

type Action = { type: 'archive' | 'delete'; node: CategoryNode } | null;

export function CategoryManager({ moduleType }: { moduleType: ModuleType }) {
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; category?: CategoryNode | null; parentId?: string | null }>({ open: false });
  const [action, setAction] = useState<Action>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'categories', moduleType, showArchived],
    queryFn: () => adminApi.categories(moduleType, showArchived),
  });

  const act = useAdminMutation(({ id, type }: { id: string; type: 'activate' | 'deactivate' | 'archive' | 'restore' }) => adminApi.categoryAction(id, type), {
    success: 'Category updated',
    onSuccess: () => setAction(null),
  });
  const del = useAdminMutation((id: string) => adminApi.deleteCategory(id), { success: 'Category deleted', onSuccess: () => setAction(null) });
  const reorder = useAdminMutation((items: { id: string; sortOrder: number }[]) => adminApi.reorderCategories(items), { success: 'Order saved' });

  const move = (siblings: CategoryNode[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const order = [...siblings];
    [order[index], order[target]] = [order[target]!, order[index]!];
    reorder.mutate(order.map((n, i) => ({ id: n._id, sortOrder: i })));
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const parentOptions = flattenTree((data ?? []).filter((n) => n.status !== 'archived')).filter((o) => o.node.depth < 4 && o.node.status !== 'archived').map(({ value, label }) => ({ value, label }));

  const renderRows = (nodes: CategoryNode[]): React.ReactNode =>
    nodes.map((node, i) => (
      <div key={node._id}>
        <div className={cn('flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5 hover:bg-slate-50', node.status === 'archived' && 'opacity-60')} style={{ paddingLeft: 12 + node.depth * 24 }}>
          <button type="button" onClick={() => toggle(node._id)} className={cn('rounded p-0.5 text-slate-400', !node.children.length && 'invisible')} aria-label="Toggle children">
            {collapsed.has(node._id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <div className="min-w-[160px] flex-1">
            <span className="font-medium text-slate-900">{node.name}</span>
            <span className="ml-2 text-xs text-slate-400">/{node.slug}</span>
          </div>
          <span className="text-xs text-slate-500">
            {moduleType === 'PYQS' ? `${node.testCount ?? 0} papers` : `${node.seriesCount ?? 0} series • ${node.testCount ?? 0} tests`}
          </span>
          <Link to={`/admin/questions?category=${node._id}`} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 hover:bg-brand-100" title="View questions in this category">
            {node.questionCount ?? 0} questions
          </Link>
          <StatusBadge status={node.status} />
          <div className="flex items-center gap-0.5">
            <IconBtn label="Move up" onClick={() => move(nodes, i, -1)} disabled={i === 0 || reorder.isPending}>
              <ArrowUp className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Move down" onClick={() => move(nodes, i, 1)} disabled={i === nodes.length - 1 || reorder.isPending}>
              <ArrowDown className="h-4 w-4" />
            </IconBtn>
            {node.status !== 'archived' && (
              <>
                {node.depth < 4 && (
                  <IconBtn label="Add sub-category" onClick={() => setEditor({ open: true, category: null, parentId: node._id })}>
                    <Plus className="h-4 w-4" />
                  </IconBtn>
                )}
                <IconBtn label="Edit" onClick={() => setEditor({ open: true, category: node })}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn label={node.isActive ? 'Deactivate' : 'Activate'} onClick={() => act.mutate({ id: node._id, type: node.isActive ? 'deactivate' : 'activate' })}>
                  {node.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconBtn>
                <IconBtn label="Archive" onClick={() => setAction({ type: 'archive', node })}>
                  <Archive className="h-4 w-4" />
                </IconBtn>
              </>
            )}
            {node.status === 'archived' && (
              <IconBtn label="Restore" onClick={() => act.mutate({ id: node._id, type: 'restore' })}>
                <RotateCcw className="h-4 w-4" />
              </IconBtn>
            )}
            {!node.children.length && !(node.seriesCount || node.testCount) && (
              <IconBtn label="Delete" danger onClick={() => setAction({ type: 'delete', node })}>
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            )}
          </div>
        </div>
        {!collapsed.has(node._id) && node.children.length > 0 && renderRows(node.children)}
      </div>
    ));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-brand-600" /> Show archived
        </label>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditor({ open: true, category: null, parentId: null })}>
          {moduleType === 'PYQS' ? 'Add exam' : 'Add category'}
        </Button>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="card overflow-hidden">
          {isLoading ? <TableSkeleton rows={8} cols={3} /> : data?.length ? renderRows(data) : <EmptyState title="No categories yet" className="rounded-none border-0" />}
        </div>
      )}

      <CategoryEditor open={editor.open} onClose={() => setEditor({ open: false })} moduleType={moduleType} category={editor.category} parentId={editor.parentId} parentOptions={parentOptions} />

      <ConfirmDialog
        open={!!action}
        tone="danger"
        title={action?.type === 'delete' ? 'Delete category?' : 'Archive category?'}
        message={
          action?.type === 'delete'
            ? `"${action.node.name}" will be permanently deleted.`
            : `"${action?.node.name}" and all its sub-categories will be hidden and archived. Categories with published content cannot be archived.`
        }
        confirmLabel={action?.type === 'delete' ? 'Delete' : 'Archive'}
        loading={act.isPending || del.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (!action) return;
          if (action.type === 'delete') del.mutate(action.node._id);
          else act.mutate({ id: action.node._id, type: 'archive' });
        }}
      />
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn('rounded-md p-1.5 text-slate-500 transition disabled:opacity-30', danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-slate-100 hover:text-slate-900')}
    >
      {children}
    </button>
  );
}

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<ModuleType>('TEST_SERIES');
  return (
    <div>
      <PageHeader title="Categories" description="Organise exams and subjects. Changes appear on the student site immediately." />
      <div className="mb-4 inline-flex rounded-lg bg-white p-1 shadow-card">
        {(['TEST_SERIES', 'PYQS'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setTab(m)} className={cn('rounded-md px-4 py-1.5 text-sm font-semibold', tab === m ? 'bg-brand-600 text-white' : 'text-slate-600')}>
            {m === 'TEST_SERIES' ? 'Test Series' : 'PYQs'}
          </button>
        ))}
      </div>
      <CategoryManager key={tab} moduleType={tab} />
    </div>
  );
}
