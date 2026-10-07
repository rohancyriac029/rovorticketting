'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
} from '@app/shared';
import { EMPTY_FILTERS, hasActiveFilters, type FilterState } from '@/lib/ticketFilters';

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function TicketFilterBar({
  value,
  onChange,
}: {
  value: FilterState;
  /**
   * Takes an updater, not a value: every change is applied to the filters as they are at that
   * moment, so a delayed search update can't overwrite a chip toggled (or a clear) in between.
   */
  onChange: (update: (prev: FilterState) => FilterState) => void;
}) {
  // The box updates on every keystroke; the filter itself only after typing pauses.
  const [q, setQ] = useState(value.q);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const emittedQ = useRef(value.q);

  useEffect(() => () => clearTimeout(timer.current), []);

  // The search term was changed from outside (e.g. the empty state's Clear Filters): follow it.
  useEffect(() => {
    if (value.q !== emittedQ.current) {
      clearTimeout(timer.current);
      emittedQ.current = value.q;
      setQ(value.q);
    }
  }, [value.q]);

  function handleSearch(next: string) {
    setQ(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      emittedQ.current = next;
      onChange((prev) => ({ ...prev, q: next }));
    }, 300);
  }

  function clearAll() {
    clearTimeout(timer.current);
    emittedQ.current = '';
    setQ('');
    onChange(() => EMPTY_FILTERS);
  }

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
          onChange={(e) => handleSearch(e.target.value)}
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
          onToggle={(s) => onChange((prev) => ({ ...prev, status: toggle(prev.status, s) }))}
        />
        <ChipGroup
          label="Priority"
          options={TICKET_PRIORITIES}
          labels={TICKET_PRIORITY_LABELS}
          selected={value.priority}
          onToggle={(p) => onChange((prev) => ({ ...prev, priority: toggle(prev.priority, p) }))}
        />
        {(hasActiveFilters(value) || q) && (
          <button
            type="button"
            onClick={clearAll}
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
    <div
      role="group"
      aria-label={`Filter by ${label.toLowerCase()}`}
      className="flex items-center gap-1.5"
    >
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
