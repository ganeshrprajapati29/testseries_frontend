import { BookOpen, ChevronDown, ExternalLink, Lightbulb, Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/Badge';
import { cn } from '@/lib/utils';

interface Action {
  /** What the admin does */
  do: string;
  /** What happens */
  result: string;
}

interface Section {
  id: string;
  title: string;
  /** Admin page this section is about */
  to?: string;
  intro: string;
  actions: Action[];
  tips?: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'start',
    title: 'Getting started (first day)',
    intro: 'Do these steps once, in this order, before adding content.',
    actions: [
      { do: 'My Account → Login email / Change password', result: 'Your own email and a new strong password become your admin login. Other devices are signed out.' },
      { do: 'Settings → fill site name, phone, email, address, social links', result: 'The student website header, footer and contact details update immediately.' },
      { do: 'Categories → check the tree (Exam › Paper › Subject)', result: 'This tree decides where everything appears on the website. Get it right first.' },
      { do: 'Question Bank / Bulk Import → add questions into categories', result: 'Each question appears on the website on its category page (see "Where does a question appear?").' },
      { do: 'Test Series → create a series, then add tests and publish', result: 'Students can see, enrol in and attempt the tests.' },
    ],
  },
  {
    id: 'flow',
    title: 'Where does a question appear on the website?',
    intro: 'Students never see the Question Bank itself - they see tests, PYQ papers and practice sets. This is how a question gets there.',
    actions: [
      { do: 'Save a question in a category (e.g. UPSC › Prelims › Paper-I)', result: 'It is added automatically to that category\'s "Practice Set" and shows on that category page of the website within seconds.' },
      { do: 'Save a question in a PYQ category (e.g. CAPF Paper 1 › 2025 › History)', result: 'It appears on the PYQs page of that exam as a paper ("… – Practice Set"). A year in the category name becomes the paper year.' },
      { do: 'Put the same question in a parent AND a sub-category', result: 'It goes only into the most specific (deepest) category\'s practice set - no duplicates.' },
      { do: 'Add the question to a test and publish the test', result: 'It moves out of the practice set into that test (so students do not see it twice).' },
      { do: 'Unpublish or delete that test', result: 'The question returns to its category\'s practice set automatically.' },
      { do: 'Question without any category and not in a test', result: 'Students cannot see it. The Question Bank marks it "Uncategorized" - give it a category.' },
      { do: 'More than 50 questions in one category', result: 'Practice sets are split: "Practice Set 1", "Practice Set 2", … (50 questions each).' },
    ],
    tips: ['Open any question\'s page ("Open question page") to see exactly which tests / practice sets show it on the website, with direct "View" links.'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    to: '/admin',
    intro: 'Overview of students, tests, attempts, revenue and recent results.',
    actions: [{ do: 'Open the dashboard', result: 'Shows live numbers. Nothing is changed.' }],
  },
  {
    id: 'categories',
    title: 'Categories',
    to: '/admin/categories',
    intro: 'Two trees: Test Series (exam → paper → subject) and PYQs (exam → subject or year). Every series, test, paper and question is placed in this tree.',
    actions: [
      { do: 'Add category / Add sub-category', result: 'A new page appears on the website under its parent once it has published content.' },
      { do: 'Edit → change name / parent', result: 'Moves the category with everything inside it. Website links update.' },
      { do: 'Deactivate', result: 'Hidden from the website menus; content stays.' },
      { do: 'Archive', result: 'Removes the category (and sub-categories). Blocked while published series / tests are inside - unpublish or move them first. Practice sets are removed automatically.' },
      { do: 'Delete', result: 'Only for an empty category without sub-categories. Questions inside are kept, just unlinked.' },
      { do: 'Click "N questions" on a category', result: 'Opens the Question Bank filtered to that category.' },
    ],
  },
  {
    id: 'series',
    title: 'Test Series',
    to: '/admin/test-series',
    intro: 'A series is a package of tests (free or paid) shown as a card on the website.',
    actions: [
      { do: 'New test series → fill title, category, price, cover image', result: 'Created as a draft (not visible to students).' },
      { do: 'Auto-translate empty Hindi fields when saving (tick)', result: 'Hindi title, description and highlights are filled from English automatically.' },
      { do: 'Publish', result: 'The series card appears on the website in its category.' },
      { do: 'Open a series → Add test', result: 'Creates a test inside this series (inherits free/paid access).' },
      { do: 'Delete', result: 'Deleted if nobody enrolled/attempted, otherwise archived (kept for results).' },
    ],
  },
  {
    id: 'tests',
    title: 'Tests',
    to: '/admin/tests',
    intro: 'A test is one exam paper with a timer. Questions come from the Question Bank.',
    actions: [
      { do: 'New test → "Where does this test go?" (series + category)', result: 'The preview shows exactly where students will find it.' },
      { do: 'Add from question bank / Write new question / Import from Excel', result: 'Questions are added to the test and filed under the test\'s category.' },
      { do: 'Reorder (arrows) → Save changes', result: 'New order is used for new attempts.' },
      { do: 'Publish', result: 'Students can open and attempt it. Its questions leave the category practice set.' },
      { do: 'Upload question paper / solutions PDF (Settings tab)', result: 'Students with access can download them; solutions unlock after submitting.' },
      { do: 'Tests marked "Auto practice set"', result: 'Created automatically from Question Bank categories. You cannot add/remove questions there - edit the category\'s questions instead. You can still change marks, timing or unpublish.' },
      { do: 'Delete', result: 'Deleted if never attempted, otherwise archived so results stay.' },
    ],
  },
  {
    id: 'questions',
    title: 'Question Bank',
    to: '/admin/questions',
    intro: 'All questions. The left tree filters by category; a parent shows everything below it.',
    actions: [
      { do: 'New question (while a category is open)', result: 'The question is saved in that category and reaches the website via its practice set.' },
      { do: 'Auto-translate to Hindi (tick, bottom of the editor)', result: 'If the Hindi tab is empty, Hindi is filled automatically on save. "Translate from English" fills it now so you can review.' },
      { do: 'Tick questions → Assign categories', result: 'Add to / replace / remove categories for many questions at once. Website practice sets update.' },
      { do: 'Tick questions → Translate to Hindi', result: 'Up to 100 questions get a Hindi version.' },
      { do: '⋮ → Open question page / Copy question link', result: 'Every question has its own direct link (/admin/questions/…) showing the question, answer, Hindi, categories and where it is on the website.' },
      { do: '⋮ → View on website (or "Open on website" on the question page)', result: 'Opens the student website page where the question appears (its paper / test). The question page also tells you its number in that paper, e.g. "question 2 of 16", and links the category page.' },
      { do: 'Archive', result: 'Hidden from new tests and practice sets. Blocked while it is in a published normal test.' },
      { do: 'Delete permanently', result: 'Only for questions never used in a test or attempt.' },
    ],
  },
  {
    id: 'pyqs',
    title: 'PYQs (previous year papers)',
    to: '/admin/pyqs',
    intro: 'Papers listed by exam and year on the website\'s PYQs section.',
    actions: [
      { do: 'Add paper → choose Exam / subject, year, questions', result: 'After publishing, the paper appears under that exam and year.' },
      { do: 'Or just file questions in a PYQ category', result: 'They appear automatically as a practice paper for that category.' },
    ],
  },
  {
    id: 'import',
    title: 'Bulk Import (Excel / CSV)',
    to: '/admin/imports',
    intro: 'Add many questions at once. Download the template first.',
    actions: [
      { do: 'Choose file + Default category → Upload', result: 'Nothing is saved yet. You see errors, duplicates and "Where these questions will go".' },
      { do: 'Category column in the file', result: 'Overrides the default category for that row. Write a path with names or slugs: CAPF Paper 1 > 2025 > History, defence/cds/maths, or pyqs:nda/maths. Several categories: separate with | .' },
      { do: 'Rows without any category', result: 'A yellow warning appears - they will not show on the website until added to a test. Cancel and pick a default category.' },
      { do: 'Skip duplicate questions (ticked)', result: 'Questions already in the bank are not created again - the existing question is filed under the row\'s category (and added to the target test).' },
      { do: 'Import N question(s)', result: 'Questions are saved and appear on the website in their categories immediately.' },
      { do: 'Import from a test page ("Import from Excel/CSV")', result: 'The imported questions are also added to that test.' },
    ],
    tips: ['Row errors list the exact row and column to fix. Fix the file and upload again - nothing from a cancelled import is saved.'],
  },
  {
    id: 'reports',
    title: 'Reported Questions',
    to: '/admin/question-reports',
    intro: 'Students can flag a wrong question from the test screen or solutions. The red badge in the sidebar shows how many questions wait for review.',
    actions: [
      { do: 'Review', result: 'Shows the question, answer key and every student report.' },
      { do: 'Edit / fix question', result: 'Opens the editor. Fixes apply to new attempts (old results are not re-scored).' },
      { do: 'Mark all resolved / Dismiss all (with a reply)', result: 'Students see your reply under the question in their solutions.' },
    ],
  },
  {
    id: 'students',
    title: 'Students',
    to: '/admin/students',
    intro: 'All registered students with search, status tabs and CSV export.',
    actions: [
      { do: 'Add student', result: 'Creates an account; share the generated password with the student.' },
      { do: 'Edit / Reset password', result: 'Changes details or sets a new password (the student is signed out everywhere).' },
      { do: 'Suspend / Activate', result: 'A suspended student cannot sign in.' },
      { do: 'Profile → Series access → Grant', result: 'Gives free access to a paid series (e.g. offline payment).' },
      { do: 'Delete', result: 'Removes the student with attempts and results. Students with payments can only be suspended.' },
    ],
  },
  {
    id: 'results',
    title: 'Attempts & Results',
    to: '/admin/results',
    intro: 'Every attempt (including running ones) and every result.',
    actions: [
      { do: 'Filter by test / student / date', result: 'Narrows the list.' },
      { do: 'Export CSV', result: 'Downloads the filtered results for Excel.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    to: '/admin/settings',
    intro: 'Site-wide text shown on the website (super admin only).',
    actions: [
      { do: 'Change hero title, announcement, contact details → Save changes', result: 'The website updates immediately. Leave "announcement" empty to hide the top banner.' },
      { do: 'Registration open = off', result: 'New students cannot register; existing students can still sign in.' },
    ],
  },
  {
    id: 'account',
    title: 'My Account & admin accounts',
    to: '/admin/account',
    intro: 'Your login details. Super admins also manage other admins here.',
    actions: [
      { do: 'Login email (+ current password)', result: 'Your sign-in email changes. You stay signed in here.' },
      { do: 'Change password', result: 'New password; other devices are signed out.' },
      { do: 'Admin accounts → Add admin', result: 'Creates another admin login (Admin = content & students, Super admin = everything).' },
      { do: 'Admin accounts → Reset password', result: 'Sets a new password for an admin who forgot it.' },
    ],
    tips: ['The last active super admin can never be removed, so you cannot lock yourself out.'],
  },
  {
    id: 'audit',
    title: 'Audit Logs',
    to: '/admin/audit-logs',
    intro: 'Who changed what and when (logins, edits, deletes, imports).',
    actions: [{ do: 'Filter by action / admin / date', result: 'Find a change. Logs cannot be edited.' }],
  },
  {
    id: 'faq',
    title: 'Common questions',
    intro: 'Quick fixes for things that confuse new admins.',
    actions: [
      { do: 'I added questions but students cannot see them', result: 'Give the questions a category (Question Bank → tick → Assign categories) or add them to a test and publish it. Open the question page to check "On the website".' },
      { do: 'A test does not show on the website', result: 'It must be Published, have questions, an active category, and (if in a series) a published series. Check "Available from / until" dates too.' },
      { do: 'Students see an old version of the website', result: 'Ask them to refresh (Ctrl + F5). Content changes are live immediately.' },
      { do: 'I forgot my admin password', result: 'Another super admin resets it in My Account → Admin accounts.' },
    ],
  },
];

function SectionCard({ section, open, onToggle }: { section: Section; open: boolean; onToggle: () => void }) {
  return (
    <section id={section.id} className="card scroll-mt-20 overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50">
        <span>
          <span className="block font-semibold">{section.title}</span>
          <span className="block text-sm text-slate-500">{section.intro}</span>
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-2/5">When you…</th>
                  <th>What happens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.actions.map((a) => (
                  <tr key={a.do}>
                    <td className="font-medium text-slate-800">{a.do}</td>
                    <td className="text-slate-600">{a.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.tips?.map((t) => (
            <p key={t} className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" /> {t}
            </p>
          ))}
          {section.to && (
            <Link to={section.to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Open {section.title.split(' (')[0]} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminManualPage() {
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(['start', 'flow']));
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = useMemo(
    () =>
      words.length
        ? SECTIONS.filter((s) => {
            const text = [s.title, s.intro, ...s.actions.flatMap((a) => [a.do, a.result]), ...(s.tips ?? [])].join(' ').toLowerCase();
            return words.every((w) => text.includes(w));
          })
        : SECTIONS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search],
  );
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  let content: ReactNode;
  if (!visible.length) content = <p className="card p-6 text-center text-sm text-slate-500">Nothing found for “{search}”.</p>;
  else content = visible.map((s) => <SectionCard key={s.id} section={s} open={words.length > 0 || openIds.has(s.id)} onToggle={() => toggle(s.id)} />);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Admin Manual" description="What every part of the admin panel does - and what happens when you click each button." />
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the manual, e.g. import category, practice set, password" className="field pl-9" aria-label="Search the manual" />
        </div>
        <div className="flex gap-2">
          <button type="button" className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setOpenIds(new Set(SECTIONS.map((s) => s.id)))}>
            Expand all
          </button>
          <button type="button" className="text-sm font-semibold text-slate-500 hover:underline" onClick={() => setOpenIds(new Set())}>
            Collapse all
          </button>
        </div>
      </div>
      {!words.length && (
        <nav aria-label="Manual contents" className="card mb-5 flex flex-wrap gap-x-4 gap-y-1.5 p-4 text-sm">
          <BookOpen className="h-4 w-4 text-brand-600" />
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpenIds((p) => new Set(p).add(s.id))}
              className="font-medium text-slate-600 hover:text-brand-700"
            >
              {s.title}
            </a>
          ))}
        </nav>
      )}
      <div className="space-y-3">{content}</div>
    </div>
  );
}
