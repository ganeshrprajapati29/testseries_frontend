import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, FolderTree, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '@/features/admin/admin.api';
import { cn } from '@/lib/utils';
import type { CategoryNode, ModuleType } from '@/types';

export interface FlatCategory {
  id: string;
  name: string;
  label: string;
  depth: number;
  moduleType: ModuleType;
  questionCount: number;
  /** Ids of all parent categories, root first. */
  ancestors: string[];
  status: string;
}

/** Both category trees (Test Series + PYQs) flattened in display order with "A › B › C" labels. */
export function useFlatCategories(enabled = true) {
  const query = useQuery({
    queryKey: ['admin', 'categories', 'all-flat'],
    queryFn: () => adminApi.categories(),
    enabled,
    staleTime: 60_000,
  });
  const flat = useMemo(() => {
    const out: FlatCategory[] = [];
    const walk = (nodes: CategoryNode[], prefix: string, ancestors: string[]) => {
      for (const n of [...nodes].sort((a, b) => a.sortOrder - b.sortOrder)) {
        const label = prefix ? `${prefix} › ${n.name}` : n.name;
        out.push({
          id: n._id,
          name: n.name,
          label,
          depth: n.depth,
          moduleType: n.moduleType,
          questionCount: n.questionCount ?? 0,
          ancestors,
          status: n.status,
        });
        walk(n.children, label, [...ancestors, n._id]);
      }
    };
    const roots = query.data ?? [];
    walk(
      roots.filter((r) => r.moduleType === 'TEST_SERIES'),
      '',
      [],
    );
    walk(
      roots.filter((r) => r.moduleType === 'PYQS'),
      '',
      [],
    );
    return out;
  }, [query.data]);
  return { ...query, flat, tree: query.data ?? [] };
}

export const MODULE_LABEL: Record<ModuleType, string> = {
  TEST_SERIES: 'Test Series',
  PYQS: 'PYQs',
};

interface CategoryPickerProps {
  label?: string;
  value: string[] | undefined;
  onChange: (ids: string[]) => void;
  max?: number;
  hint?: string;
  error?: string;
}

/** Multi-select of categories / sub-categories from both trees, with search. */
export function CategoryPicker({ label = 'Categories', value: raw, onChange, max = 10, hint, error }: CategoryPickerProps) {
  const value = Array.isArray(raw) ? raw : [];
  const { flat, isLoading } = useFlatCategories();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => new Map(flat.map((c) => [c.id, c])), [flat]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const term = search.trim().toLowerCase();
  // Every typed word must appear in the path, so "nda physics" finds "NDA › Physics".
  const words = term.split(/\s+/).filter(Boolean);
  const visible = words.length ? flat.filter((c) => words.every((w) => c.label.toLowerCase().includes(w))) : flat;
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <div ref={box} className="relative">
      <span className="label">{label}</span>
      <div
        className={cn('field flex min-h-10 flex-wrap items-center gap-1.5 py-1.5', error && 'field-error')}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      >
        {value.length === 0 && <span className="text-sm text-slate-400">{isLoading ? 'Loading categories...' : 'Choose category / sub-category'}</span>}
        {value.map((id) => {
          const c = byId.get(id);
          return (
            <span
              key={id}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                c?.moduleType === 'PYQS' ? 'bg-accent-50 text-accent-800' : 'bg-brand-50 text-brand-800',
              )}
            >
              <span className="truncate">{c ? c.label : 'Unknown category'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter((v) => v !== id));
                }}
                aria-label={`Remove ${c?.label ?? 'category'}`}
                className="rounded hover:bg-black/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
      </div>
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-pop">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search e.g. CDS Maths" className="field pl-8" aria-label="Search categories" />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
            {(['TEST_SERIES', 'PYQS'] as ModuleType[]).map((m) => {
              const items = visible.filter((c) => c.moduleType === m);
              if (!items.length) return null;
              return (
                <li key={m}>
                  <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">{MODULE_LABEL[m]}</p>
                  <ul>
                    {items.map((c) => {
                      const selected = value.includes(c.id);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => toggle(c.id)}
                            className={cn('flex w-full items-center gap-2 py-1.5 pr-3 text-left text-sm hover:bg-slate-50', selected && 'bg-brand-50/60')}
                            style={{
                              paddingLeft: 12 + (term ? 0 : c.depth * 16),
                            }}
                          >
                            <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                            <span className={cn('flex-1 truncate', c.depth === 0 && !term && 'font-semibold')}>{term ? c.label : c.name}</span>
                            <span className="text-[11px] text-slate-400">{c.questionCount}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
            {!visible.length && <li className="px-3 py-6 text-center text-sm text-slate-500">No category matches “{search}”.</li>}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            <span>
              {value.length}/{max} selected
            </span>
            <button type="button" onClick={() => setOpen(false)} className="font-semibold text-brand-700">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small read-only chips for listing a question's categories. */
export function CategoryChips({ categories, max = 3 }: { categories?: { _id: string; label: string; moduleType: ModuleType }[]; max?: number }) {
  if (!categories?.length)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
        <FolderTree className="h-3 w-3" /> Uncategorized
      </span>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {categories.slice(0, max).map((c) => (
        <span
          key={c._id}
          title={c.label}
          className={cn('max-w-[220px] truncate rounded px-1.5 py-0.5 text-[11px] font-medium', c.moduleType === 'PYQS' ? 'bg-accent-50 text-accent-800' : 'bg-brand-50 text-brand-800')}
        >
          {c.label}
        </span>
      ))}
      {categories.length > max && <span className="text-[11px] text-slate-500">+{categories.length - max}</span>}
    </div>
  );
}

interface CategoryTreeSelectProps {
  label: string;
  value: string;
  onChange: (id: string) => void;
  moduleType: ModuleType;
  /** Only this category and its sub-categories can be chosen (e.g. the category of the selected series). */
  withinId?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

/** Single category picker that shows the tree with indentation, word search and the full "A › B › C" path. */
export function CategoryTreeSelect({ label, value, onChange, moduleType, withinId, placeholder = 'Choose category / sub-category', hint, error, required }: CategoryTreeSelectProps) {
  const { flat, isLoading } = useFlatCategories();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const options = flat.filter((c) => c.moduleType === moduleType && c.status !== 'archived' && (!withinId || c.id === withinId || c.ancestors.includes(withinId)));
  const selected = flat.find((c) => c.id === value);
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = words.length ? options.filter((c) => words.every((w) => c.label.toLowerCase().includes(w))) : options;
  const baseDepth = withinId ? (flat.find((c) => c.id === withinId)?.depth ?? 0) : 0;
  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={box} className="relative">
      {label && (
        <span className="label">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          )}
        </span>
      )}
      <button
        type="button"
        aria-label={label || placeholder}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        className={cn('field flex min-h-10 w-full items-center gap-2 text-left', error && 'field-error')}
      >
        <FolderTree className="h-4 w-4 shrink-0 text-slate-400" />
        {selected ? (
          <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-sm">
            {selected.label.split(' › ').map((part, i, all) => (
              <span key={i} className={cn(i === all.length - 1 ? 'font-semibold text-slate-900' : 'text-slate-500')}>
                {part}
                {i < all.length - 1 && <span className="ml-1 text-slate-300">›</span>}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-sm text-slate-400">{isLoading ? 'Loading categories...' : placeholder}</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-pop">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search e.g. NDA Maths" className="field pl-8" aria-label={`Search ${label || 'categories'}`} />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox" aria-label={label || placeholder}>
            {value && !required && (
              <li>
                <button type="button" onClick={() => pick('')} className="w-full px-3 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-50">
                  {placeholder}
                </button>
              </li>
            )}
            {visible.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.id === value}
                  onClick={() => pick(c.id)}
                  className={cn('flex w-full items-center gap-2 py-1.5 pr-3 text-left text-sm hover:bg-slate-50', c.id === value && 'bg-brand-50 text-brand-800')}
                  style={{
                    paddingLeft: 12 + (words.length ? 0 : (c.depth - baseDepth) * 18),
                  }}
                >
                  {c.id === value ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : <span className="h-4 w-4 shrink-0" />}
                  <span className={cn('flex-1 truncate', c.depth === baseDepth && !words.length && 'font-semibold')}>{words.length ? c.label : c.name}</span>
                  {c.status === 'inactive' && <span className="text-[11px] text-amber-600">hidden</span>}
                </button>
              </li>
            ))}
            {!visible.length && <li className="px-3 py-6 text-center text-sm text-slate-500">{isLoading ? 'Loading...' : `No category matches “${search}”.`}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
