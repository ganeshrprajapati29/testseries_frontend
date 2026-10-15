import { PageHeader } from '@/components/common/Badge';
import { AttemptsTable } from '../components/AttemptsTable';

export default function AttemptHistoryPage() {
  return (
    <div>
      <PageHeader title="Attempt History" description="Every test you have started, including attempts that are still in progress." />
      <AttemptsTable />
    </div>
  );
}
