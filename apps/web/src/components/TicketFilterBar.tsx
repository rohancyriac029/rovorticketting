'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
} from '@app/shared';
import { EMPTY_FILTERS, hasActiveFilters, type FilterState } from '@/lib/ticketFilters';
import { SearchField } from './SearchField';

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
  // Bumped by Clear Filters to remount the search box, dropping any term still waiting to apply.
  const [resetCount, setResetCount] = useState(0);

  function clearAll() {
    setResetCount((c) => c + 1);
    onChange(() => EMPTY_FILTERS);
  }

  return (
    <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
      <SearchField
        key={resetCount}
        value={value.q}
        onChange={(q) => onChange((prev) => ({ ...prev, q }))}
        label="Search tickets by title or description"
        placeholder="Search tickets…"
        className="lg:w-72 lg:shrink-0"
      />

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
        {hasActiveFilters(value) && (
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
