import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface RowAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/** Compact "more" menu for table rows. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;
  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Actions" aria-haspopup="menu" aria-expanded={open}>
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-pop">
          {visible.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
              className={cn('block w-full rounded-md px-3 py-2 text-left text-sm', a.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50')}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
