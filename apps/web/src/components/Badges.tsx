import { ChevronsUp, Equal, ChevronDown } from 'lucide-react';
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@app/shared';
import type { TicketPriority, TicketStatus } from '@app/shared';

export const STATUS_TONE: Record<TicketStatus, string> = {
  TODO: 'tone-neutral',
  IN_PROGRESS: 'tone-ochre',
  DONE: 'tone-green',
};

const PRIORITY_TONE: Record<TicketPriority, string> = {
  LOW: 'tone-neutral',
  MEDIUM: 'tone-ochre',
  HIGH: 'tone-red',
};

const PRIORITY_ICON = { LOW: ChevronDown, MEDIUM: Equal, HIGH: ChevronsUp } as const;

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge ${STATUS_TONE[status]}`}>
      <span className="dot" aria-hidden />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

export function StatusDot({ status }: { status: TicketStatus }) {
  return (
    <span className={STATUS_TONE[status]}>
      <span className="dot" aria-hidden />
      <span className="sr-only">{TICKET_STATUS_LABELS[status]}:</span>
    </span>
  );
}

/** Icon + label rather than a second pill, so priority reads differently from status at a glance. */
export function PriorityLabel({ priority }: { priority: TicketPriority }) {
  const Icon = PRIORITY_ICON[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium ${PRIORITY_TONE[priority]}`}
    >
      <Icon className="h-4 w-4 text-[var(--tone-dot)]" aria-hidden />
      <span className="text-[var(--tone-fg)]">{TICKET_PRIORITY_LABELS[priority]}</span>
    </span>
  );
}
