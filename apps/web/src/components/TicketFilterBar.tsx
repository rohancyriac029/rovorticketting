'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
} from '@app/shared';

export interface FilterState {
  q: string;
  status: string[];
  priority: string[];
}

export function TicketFilterBar({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const [q, setQ] = useState(value.q);

  useEffect(() => setQ(value.q), [value.q]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== value.q) onChange({ ...value, q });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function toggle(list: string[], item: string) {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  }

  const hasFilters = value.q || value.status.length > 0 || value.priority.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tickets…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TICKET_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onChange({ ...value, status: toggle(value.status, s) })}
            className={`badge border ${
              value.status.includes(s)
                ? 'border-ochre-500 bg-ochre-500 text-white'
                : 'border-[var(--border)] bg-transparent text-[var(--text-muted)]'
            }`}
          >
            {TICKET_STATUS_LABELS[s]}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        {TICKET_PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => onChange({ ...value, priority: toggle(value.priority, p) })}
            className={`badge border ${
              value.priority.includes(p)
                ? 'border-ochre-500 bg-ochre-500 text-white'
                : 'border-[var(--border)] bg-transparent text-[var(--text-muted)]'
            }`}
          >
            {TICKET_PRIORITY_LABELS[p]}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={() => {
              setQ('');
              onChange({ q: '', status: [], priority: [] });
            }}
            className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-rose-600"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
