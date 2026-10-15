import { BookOpenCheck, FileText, History, LayoutDashboard, Library, UserCog } from 'lucide-react';
import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';
import { Loader } from '../common/Loader';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollToTop } from './PublicLayout';
import { Sidebar, type SidebarItem } from './Sidebar';

const ITEMS: SidebarItem[] = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.myTests, label: 'My Tests', icon: BookOpenCheck },
  { to: ROUTES.myResults, label: 'My Results', icon: FileText },
  { to: ROUTES.attempts, label: 'Attempt History', icon: History },
  { to: ROUTES.testSeries, label: 'Explore Test Series', icon: Library },
  { to: ROUTES.profile, label: 'Profile & Settings', icon: UserCog },
];

export function StudentLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <div className="container-page flex flex-1 gap-8 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="card p-4">
              <p className="text-xs text-slate-500">Welcome back,</p>
              <p className="truncate font-semibold">{user?.name}</p>
            </div>
            <div className="card p-2">
              <Sidebar items={ITEMS} />
            </div>
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Student">
            {ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                    isActive ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600',
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </NavLink>
            ))}
          </nav>
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}

