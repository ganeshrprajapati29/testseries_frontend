import { ExternalLink, LogOut, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { Badge } from '../common/Badge';

export function AdminHeader({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" target="_blank" className="hidden items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700 sm:flex">
          View student site <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <Badge tone={user?.role === 'superadmin' ? 'purple' : 'blue'}>{user?.role}</Badge>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/admin/login');
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
