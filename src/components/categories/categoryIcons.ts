import { Atom, BookOpen, Building2, Calculator, FlaskConical, Globe2, GraduationCap, Landmark, Languages, Leaf, Map, Monitor, Plane, School, Scale, Shield, Swords, TrendingUp, Trophy, type LucideIcon } from 'lucide-react';

/** Icons admins can pick for a category (stored as the key in Category.icon). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  atom: Atom,
  graduation: GraduationCap,
  landmark: Landmark,
  building: Building2,
  trophy: Trophy,
  school: School,
  book: BookOpen,
  calculator: Calculator,
  flask: FlaskConical,
  globe: Globe2,
  languages: Languages,
  leaf: Leaf,
  map: Map,
  monitor: Monitor,
  plane: Plane,
  scale: Scale,
  swords: Swords,
  trending: TrendingUp,
};

const BY_NAME: Record<string, string> = {
  defence: 'shield',
  cds: 'swords',
  nda: 'shield',
  capf: 'shield',
  afcat: 'plane',
  jee: 'atom',
  net: 'graduation',
  upsc: 'landmark',
  uppcs: 'building',
  olympiad: 'trophy',
  'entrance-exam': 'school',
  maths: 'calculator',
  physics: 'atom',
  chemistry: 'flask',
  biology: 'leaf',
  geography: 'globe',
  history: 'book',
  polity: 'scale',
  economics: 'trending',
  english: 'languages',
  computer: 'monitor',
};

export function categoryIcon(icon?: string, slug?: string): LucideIcon {
  if (icon && CATEGORY_ICONS[icon]) return CATEGORY_ICONS[icon];
  const byName = slug ? BY_NAME[slug] : undefined;
  return (byName && CATEGORY_ICONS[byName]) || BookOpen;
}
