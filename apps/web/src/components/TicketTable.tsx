'use client';

import Link from 'next/link';
import type { TicketDTO } from '@app/shared';
import { PriorityBadge, StatusBadge } from './Badges';
import { relativeTime } from '@/lib/format';
import { EmptyState } from './States';

export function TicketTable({
  tickets,
  hasFilters,
  onClearFilters,
}: {
  tickets: TicketDTO[];
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? 'No tickets match these filters' : 'No tickets yet'}
        description={hasFilters ? 'Try a different search or clear your filters.' : 'Create the first ticket for this project.'}
        action={
          hasFilters ? (
            <button
              onClick={onClearFilters}
              className="rounded-full bg-ochre-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ochre-600"
            >
              Clear filters
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="font-medium text-[var(--text)] hover:text-ochre-600 dark:hover:text-ochre-300"
                >
                  {ticket.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">
                {relativeTime(ticket.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
