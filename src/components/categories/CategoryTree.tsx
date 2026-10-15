import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { CategoryNode } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryTreeProps {
  nodes: CategoryNode[];
  selectedId?: string;
  onSelect: (node: CategoryNode | null) => void;
  allLabel?: string;
}

function containsId(node: CategoryNode, id?: string): boolean {
  if (!id) return false;
  return node._id === id || node.children.some((c) => containsId(c, id));
}

function TreeItem({ node, selectedId, onSelect, level }: { node: CategoryNode; selectedId?: string; onSelect: (n: CategoryNode) => void; level: number }) {
  const [open, setOpen] = useState(() => containsId(node, selectedId) && node._id !== selectedId ? true : false);
  const hasChildren = node.children.length > 0;
  const active = node._id === selectedId;
  return (
    <li>
      <div className={cn('flex items-center rounded-lg', active ? 'bg-brand-50' : 'hover:bg-slate-50')} style={{ paddingLeft: level * 12 }}>
        {hasChildren ? (
          <button type="button" onClick={() => setOpen((o) => !o)} className="p-1.5 text-slate-400 hover:text-slate-600" aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`} aria-expanded={open}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-7" />
        )}
        <button type="button" onClick={() => onSelect(node)} className={cn('flex-1 py-1.5 pr-2 text-left text-sm', active ? 'font-semibold text-brand-700' : 'text-slate-700')}>
          {node.name}
        </button>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((c) => (
            <TreeItem key={c._id} node={c} selectedId={selectedId} onSelect={onSelect} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTree({ nodes, selectedId, onSelect, allLabel = 'All exams' }: CategoryTreeProps) {
  return (
    <ul className="space-y-0.5" aria-label="Categories">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn('w-full rounded-lg px-3 py-1.5 text-left text-sm', !selectedId ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700 hover:bg-slate-50')}
        >
          {allLabel}
        </button>
      </li>
      {nodes.map((n) => (
        <TreeItem key={n._id} node={n} selectedId={selectedId} onSelect={onSelect} level={0} />
      ))}
    </ul>
  );
}
