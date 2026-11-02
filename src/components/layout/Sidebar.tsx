import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Small counter shown next to the label (e.g. open reports). */
  badge?: number;
}

export function Sidebar({ items, onNavigate, dark }: { items: SidebarItem[]; onNavigate?: () => void; dark?: boolean }) {
  return (
    <nav className="space-y-1" aria-label="Section">
      {items.map(({ to, label, icon: Icon, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
              dark
                ? isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )
          }
        >
          <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
          {label}
          {!!badge && (
            <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] leading-none font-bold text-white" aria-label={`${badge} pending`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
