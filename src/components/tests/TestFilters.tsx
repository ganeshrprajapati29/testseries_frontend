import { SearchInput } from '../common/SearchInput';

export interface TestFilterValues {
  search: string;
  accessType: string;
  sort: string;
}

export function TestFilters({ values, onChange }: { values: TestFilterValues; onChange: (key: keyof TestFilterValues, value: string) => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput value={values.search} onSearch={(v) => onChange('search', v)} placeholder="Search test series..." className="flex-1" />
      <div className="flex gap-2">
        <select className="field w-auto" value={values.accessType} onChange={(e) => onChange('accessType', e.target.value)} aria-label="Access type">
          <option value="">Free & Paid</option>
          <option value="free">Free only</option>
          <option value="paid">Paid only</option>
        </select>
        <select className="field w-auto" value={values.sort} onChange={(e) => onChange('sort', e.target.value)} aria-label="Sort by">
          <option value="popular">Recommended</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}
