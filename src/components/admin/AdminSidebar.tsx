import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileClock,
  FileQuestion,
  FileSpreadsheet,
  Flag,
  FolderTree,
  LayoutDashboard,
  Library,
  NotebookTabs,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '@/features/admin/admin.api';
import { useSettings } from '@/hooks/useSettings';
import { Sidebar, type SidebarItem } from '../layout/Sidebar';

export const ADMIN_NAV: SidebarItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/test-series', label: 'Test Series', icon: Library },
  { to: '/admin/tests', label: 'Tests', icon: ClipboardList },
  { to: '/admin/questions', label: 'Question Bank', icon: FileQuestion },
  { to: '/admin/pyqs', label: 'PYQs', icon: NotebookTabs },
  { to: '/admin/question-reports', label: 'Reported Questions', icon: Flag },
  { to: '/admin/imports', label: 'Bulk Import', icon: FileSpreadsheet },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/attempts', label: 'Attempts', icon: FileClock },
  { to: '/admin/results', label: 'Results', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/account', label: 'My Account', icon: UserCog },
  { to: '/admin/manual', label: 'Admin Manual', icon: BookOpen },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logoUrl } = useSettings();
  const reports = useQuery({ queryKey: ['admin', 'question-reports', 'counts'], queryFn: adminApi.questionReportCounts, refetchInterval: 120_000, staleTime: 30_000 });
  const items = ADMIN_NAV.map((i) => (i.to === '/admin/question-reports' ? { ...i, badge: reports.data?.openQuestions } : i));
  return (
    <div className="flex h-full flex-col bg-slate-900 px-3 py-4">
      <Link to="/admin" className="mb-6 flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <img src={logoUrl} alt="" className="h-10 w-10 rounded-full bg-white object-contain p-0.5" />
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-white">CIVIL SANSAD</p>
          <p className="text-[11px] text-slate-400">Admin Panel</p>
        </div>
      </Link>
      <div className="flex-1 overflow-y-auto">
        <Sidebar items={items} onNavigate={onNavigate} dark />
      </div>
    </div>
  );
}
