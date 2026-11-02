import { ChevronDown, ChevronRight, FolderOpen, FolderTree, Inbox, Layers } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryNode, ModuleType } from '@/types';
import { MODULE_LABEL } from './CategoryPicker';

interface QuestionBankTreeProps {
  tree: CategoryNode[];
  selected: string;
  onSelect: (id: string) => void;
  total?: number;
  uncategorized?: number;
}

function contains(node: CategoryNode, id: string): boolean {
  return node._id === id || node.children.some((c) => contains(c, id));
}

function Node({ node, selected, onSelect }: { node: CategoryNode; selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(() => node.depth === 0 && contains(node, selected) && node._id !== selected);
  const active = node._id === selected;
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div className={cn('flex items-center rounded-lg', active ? 'bg-brand-600 text-white' : 'hover:bg-slate-100')} style={{ paddingLeft: node.depth * 14 }}>
        <button type="button" onClick={() => setOpen((o) => !o)} className={cn('p-1', !hasChildren && 'invisible', active ? 'text-white/80' : 'text-slate-400')} aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`} aria-expanded={open}>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => onSelect(node._id)} className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pr-2 text-left text-sm" aria-current={active ? 'true' : undefined}>
          <span className={cn('truncate', node.depth === 0 && 'font-semibold')}>{node.name}</span>
          <span className={cn('ml-auto shrink-0 rounded-full px-1.5 text-[11px] font-semibold', active ? 'bg-white/20' : 'bg-slate-100 text-slate-500')}>{node.questionCount ?? 0}</span>
        </button>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((c) => (
            <Node key={c._id} node={c} selected={selected} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Left sidebar of the question bank: browse questions by category / sub-category. */
export function QuestionBankTree({ tree, selected, onSelect, total, uncategorized }: QuestionBankTreeProps) {
  const [module, setModule] = useState<ModuleType>('TEST_SERIES');
  const roots = tree.filter((n) => n.moduleType === module);
  const item = (id: string, label: string, count: number | undefined, Icon: typeof Layers) => (
    <button type="button" onClick={() => onSelect(id)} className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm', selected === id ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100')}>
      <Icon className="h-4 w-4" /> <span className="flex-1 text-left font-medium">{label}</span>
      {count !== undefined && <span className={cn('rounded-full px-1.5 text-[11px] font-semibold', selected === id ? 'bg-white/20' : 'bg-slate-100 text-slate-500')}>{count}</span>}
    </button>
  );
  return (
    <div className="card p-3">
      <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
        <FolderTree className="h-4 w-4 text-brand-600" /> Browse by category
      </h2>
      <div className="space-y-0.5">
        {item('', 'All questions', total, Layers)}
        {item('none', 'Uncategorized', uncategorized, Inbox)}
      </div>
      <div className="my-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
        {(['TEST_SERIES', 'PYQS'] as ModuleType[]).map((m) => (
          <button key={m} type="button" onClick={() => setModule(m)} className={cn('rounded-md py-1', module === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
            {MODULE_LABEL[m]}
          </button>
        ))}
      </div>
      {roots.length ? (
        <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto pr-1">
          {roots.map((n) => (
            <Node key={n._id} node={n} selected={selected} onSelect={onSelect} />
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 px-2 py-4 text-xs text-slate-500">
          <FolderOpen className="h-4 w-4" /> No categories yet
        </p>
      )}
    </div>
  );
}
