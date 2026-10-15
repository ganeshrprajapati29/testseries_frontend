import { Badge } from '../common/Badge';

const MAP: Record<string, { tone: 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'orange' | 'purple'; label: string }> = {
  draft: { tone: 'gray', label: 'Draft' },
  published: { tone: 'green', label: 'Published' },
  unpublished: { tone: 'amber', label: 'Unpublished' },
  archived: { tone: 'red', label: 'Archived' },
  active: { tone: 'green', label: 'Active' },
  inactive: { tone: 'amber', label: 'Inactive' },
  suspended: { tone: 'red', label: 'Suspended' },
  deactivated: { tone: 'gray', label: 'Deactivated' },
  IN_PROGRESS: { tone: 'blue', label: 'In progress' },
  SUBMITTED: { tone: 'green', label: 'Submitted' },
  AUTO_SUBMITTED: { tone: 'orange', label: 'Auto-submitted' },
  EVALUATED: { tone: 'green', label: 'Evaluated' },
  validated: { tone: 'blue', label: 'Validated' },
  committed: { tone: 'green', label: 'Imported' },
  cancelled: { tone: 'gray', label: 'Cancelled' },
  failed: { tone: 'red', label: 'Failed' },
  created: { tone: 'amber', label: 'Pending' },
  paid: { tone: 'green', label: 'Paid' },
  refunded: { tone: 'purple', label: 'Refunded' },
  free: { tone: 'green', label: 'Free' },
  paid_access: { tone: 'orange', label: 'Paid' },
};

export function StatusBadge({ status }: { status: string }) {
  const item = MAP[status] ?? { tone: 'gray' as const, label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
