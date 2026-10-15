import { PageHeader } from '@/components/common/Badge';
import { AttemptsTable } from '../components/AttemptsTable';

export default function MyResultsPage() {
  return (
    <div>
      <PageHeader title="My Results" description="Scores, accuracy and solutions for every test you have submitted." />
      <AttemptsTable status="COMPLETED" />
    </div>
  );
}
