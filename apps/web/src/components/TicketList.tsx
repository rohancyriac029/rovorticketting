'use client';

import Link from 'next/link';
import type { TicketDTO } from '@app/shared';
import { PriorityLabel, StatusBadge } from './Badges';
import { formatDateTime, relativeTime } from '@/lib/format';

// One grid shared by the header and every row so columns line up; below `sm` rows stack instead.
const COLUMNS = 'sm:grid sm:grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_5.5rem] sm:gap-x-4';

/** A list of links rather than a <table>: the whole row is one tap target and it reflows on mobile. */
export function TicketList({ tickets, dimmed }: { tickets: TicketDTO[]; dimmed?: boolean }) {
  return (
    <div
      className={`card overflow-hidden transition-opacity ${dimmed ? 'opacity-60' : ''}`}
      aria-busy={dimmed || undefined}
    >
      <div
        aria-hidden
        className={`hidden border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-faint ${COLUMNS}`}
      >
        <span>Title</span>
        <span>Status</span>
        <span>Priority</span>
        <span className="text-right">Updated</span>
      </div>
      <ul className="divide-y divide-line">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link
              href={`/tickets/${ticket.id}`}
              className={`group block px-4 py-3.5 transition-colors hover:bg-sunken sm:items-center sm:px-5 sm:py-3 ${COLUMNS}`}
            >
              <span className="block text-sm font-medium text-ink [overflow-wrap:anywhere] group-hover:text-accent-text sm:truncate">
                {ticket.title}
              </span>
              <span className="mt-2 flex items-center gap-3 sm:contents">
                <span>
                  <StatusBadge status={ticket.status} />
                </span>
                <PriorityLabel priority={ticket.priority} />
                <time
                  dateTime={ticket.updatedAt}
                  title={formatDateTime(ticket.updatedAt)}
                  className="ml-auto text-xs tabular-nums text-muted sm:ml-0 sm:text-right sm:text-[13px]"
                >
                  {relativeTime(ticket.updatedAt)}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
