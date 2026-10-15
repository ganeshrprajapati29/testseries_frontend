import type { ReactNode } from 'react';
import type { PageMeta } from '@/types';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { Pagination } from '../common/Pagination';
import { TableSkeleton } from '../common/Skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  meta?: PageMeta;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyMessage?: ReactNode;
  emptyAction?: ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, isLoading, error, onRetry, meta, onPageChange, emptyTitle = 'Nothing here yet', emptyMessage, emptyAction }: DataTableProps<T>) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={Math.min(columns.length, 6)} />
        ) : !rows?.length ? (
          <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} className="rounded-none border-0" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className={c.className}>
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-slate-50/60">
                    {columns.map((c) => (
                      <td key={c.key} className={c.className}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {onPageChange && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  );
}
