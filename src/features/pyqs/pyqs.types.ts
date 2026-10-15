import type { Breadcrumb, CategoryNode, Language } from '@/types';

export interface PyqExamNode extends CategoryNode {
  paperCount: number;
  children: PyqExamNode[];
}

export interface PyqPaper {
  _id: string;
  title: string;
  slug: string;
  description: string;
  paperYear: number | null;
  paperName: string;
  durationSeconds: number;
  marksPerCorrect: number;
  negativeMarks: number;
  totalMarks: number;
  languageOptions: Language[];
  questionCount: number;
  subject?: { _id: string; name: string; slug: string };
}

export interface PyqCategoryData {
  category: { _id: string; name: string; slug: string; description: string; path: string; depth: number };
  breadcrumb: Breadcrumb[];
  children: { _id: string; name: string; slug: string; path: string; paperCount: number }[];
  paperCount: number;
  years: number[];
  papersByYear: { year: number | null; papers: PyqPaper[] }[];
}
