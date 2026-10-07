import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@app/shared';
import type { TicketPriority, TicketStatus } from '@app/shared';

const STATUS_STYLES: Record<TicketStatus, string> = {
  TODO: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-100',
  IN_PROGRESS: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-900 dark:text-ochre-200',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW: 'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-200',
  MEDIUM: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-900 dark:text-ochre-200',
  HIGH: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge ${STATUS_STYLES[status]}`}>{TICKET_STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority]}`}>{TICKET_PRIORITY_LABELS[priority]}</span>
  );
}
