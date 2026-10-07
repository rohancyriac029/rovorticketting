import { TICKET_STATUSES, TICKET_STATUS_LABELS, type TicketCounts } from '@app/shared';
import { STATUS_TONE } from './Badges';

/** Proportional bar + labelled counts: the split is visible at a glance and still readable without colour. */
export function StatusSummary({ counts }: { counts: TicketCounts }) {
  const description = TICKET_STATUSES.map(
    (s) => `${counts[s]} ${TICKET_STATUS_LABELS[s]}`,
  ).join(', ');

  return (
    <div>
      <div
        role="img"
        aria-label={`Tickets by status: ${description}`}
        className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-sunken"
      >
        {TICKET_STATUSES.map(
          (s) =>
            counts[s] > 0 && (
              <span
                key={s}
                className={`${STATUS_TONE[s]} bg-[var(--tone-dot)]`}
                style={{ flexGrow: counts[s] }}
              />
            ),
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {TICKET_STATUSES.map((s) => (
          <li key={s} className={`flex items-center gap-1.5 ${STATUS_TONE[s]}`}>
            <span className="dot" aria-hidden />
            <span className="font-semibold tabular-nums text-ink">{counts[s]}</span>
            <span className="text-muted">{TICKET_STATUS_LABELS[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
