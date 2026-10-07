'use client';

import { useEffect, useRef, useState } from 'react';
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

export const EMPTY_FILTERS: FilterState = { q: '', status: [], priority: [] };

export function hasActiveFilters(f: FilterState) {
  return Boolean(f.q || f.status.length || f.priority.length);
}

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function TicketFilterBar({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const [q, setQ] = useState(value.q);

  // Keep the box in sync when the URL changes underneath it (back/forward, Clear Filters).
  useEffect(() => setQ(value.q), [value.q]);

  // The debounce below fires up to 300ms after a keystroke. Reading filters through a ref means it
  // merges into the filters as they are *then*, so it can't resurrect ones cleared in the meantime.
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });

  // Debounce so each keystroke doesn't hit the API or rewrite the URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      const { value: current, onChange: change } = latest.current;
      if (q !== current.q) change({ ...current, q });
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
      <div className="relative lg:w-72 lg:shrink-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search tickets by title or description"
          placeholder="Search tickets…"
          autoComplete="off"
          className="input pl-9 [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-3">
        <ChipGroup
          label="Status"
          options={TICKET_STATUSES}
          labels={TICKET_STATUS_LABELS}
          selected={value.status}
          onToggle={(s) => onChange({ ...value, status: toggle(value.status, s) })}
        />
        <ChipGroup
          label="Priority"
          options={TICKET_PRIORITIES}
          labels={TICKET_PRIORITY_LABELS}
          selected={value.priority}
          onToggle={(p) => onChange({ ...value, priority: toggle(value.priority, p) })}
        />
        {hasActiveFilters(value) && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              onChange(EMPTY_FILTERS);
            }}
            className="ml-auto inline-flex h-9 items-center gap-1 rounded-full px-2 text-[13px] font-medium text-muted transition-colors hover:text-ink sm:h-8"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  labels,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: string[];
  onToggle: (option: T) => void;
}) {
  return (
    <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className="flex items-center gap-1.5">
      <span className="mr-0.5 text-xs font-medium text-muted">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected.includes(option)}
          onClick={() => onToggle(option)}
          className="chip"
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
