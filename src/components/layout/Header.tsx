import { BookOpenCheck, ChevronDown, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MAIN_SITE_URL, ROUTES } from '@/app/constants';
import { useAuth } from '@/features/auth/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { ButtonLink } from '../common/Button';

const NAV = [
  { to: ROUTES.home, label: 'Home', end: true },
  { to: ROUTES.testSeries, label: 'Test Series' },
  { to: ROUTES.pyqs, label: 'PYQs' },
  { to: ROUTES.categories, label: 'Exams' },
];

export function Logo({ compact }: { compact?: boolean }) {
  const { logoUrl, siteName, settings } = useSettings();
  return (
    <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label={`${siteName} home`}>
      <img src={logoUrl} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight">
            <span className="text-brand-600">CIVIL</span> <span className="text-accent-500">SANSAD</span>
          </span>
          <span className="block text-[11px] font-medium text-slate-500">{settings?.tagline || 'Test Series & PYQs'}</span>
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const items = [
    { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.myTests, label: 'My Tests', icon: BookOpenCheck },
    { to: ROUTES.myResults, label: 'My Results', icon: FileText },
    { to: ROUTES.profile, label: 'Profile & Settings', icon: UserIcon },
  ];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 hover:bg-slate-50" aria-expanded={open} aria-haspopup="menu">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">{user.name}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Icon className="h-4 w-4 text-slate-400" /> {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate(ROUTES.home);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      {settings?.announcement && <div className="bg-accent-500 px-4 py-1.5 text-center text-xs font-medium text-white sm:text-sm">{settings.announcement}</div>}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('rounded-lg px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-brand-700')}>
              {n.label}
            </NavLink>
          ))}
          <a href={settings?.mainWebsiteUrl || MAIN_SITE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:text-brand-700">
            Courses <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <ButtonLink to={ROUTES.admin} size="sm" variant="secondary">
              Admin Panel
            </ButtonLink>
          ) : user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink to={ROUTES.login} variant="ghost" size="sm">
                Login
              </ButtonLink>
              <ButtonLink to={ROUTES.register} variant="accent" size="sm">
                Register Free
              </ButtonLink>
            </div>
          )}
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('block rounded-lg px-3 py-2.5 text-sm font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700')}>
              {n.label}
            </NavLink>
          ))}
          <a href={settings?.mainWebsiteUrl || MAIN_SITE_URL} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700">
            Courses (civilsansad.com)
          </a>
          {!user && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ButtonLink to={ROUTES.login} variant="outline">
                Login
              </ButtonLink>
              <ButtonLink to={ROUTES.register} variant="accent">
                Register
              </ButtonLink>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
