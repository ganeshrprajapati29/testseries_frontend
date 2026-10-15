import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

/** Debounced search box. `onSearch` fires after the user stops typing. */
export function SearchInput({ value, onSearch, placeholder = 'Search...', className }: { value: string; onSearch: (v: string) => void; placeholder?: string; className?: string }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 400);

  useEffect(() => {
    setText(value);
  }, [value]);
  useEffect(() => {
    if (debounced !== value) onSearch(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={120}
        className="field pr-9 pl-9"
      />
      {text && (
        <button type="button" onClick={() => setText('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
