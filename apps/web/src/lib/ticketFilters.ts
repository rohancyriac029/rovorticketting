import { TICKET_PRIORITIES, TICKET_STATUSES } from '@app/shared';

export interface FilterState {
  q: string;
  status: string[];
  priority: string[];
}

export const EMPTY_FILTERS: FilterState = { q: '', status: [], priority: [] };

export function hasActiveFilters(f: FilterState) {
  return Boolean(f.q || f.status.length || f.priority.length);
}

function parseList(raw: string | null, allowed: readonly string[]) {
  // Unknown values in a hand-edited link are dropped rather than sent on to the API as a 400.
  return (raw?.split(',') ?? []).filter((v) => allowed.includes(v));
}

export function parseFilters(params: { get(name: string): string | null }): FilterState {
  return {
    q: params.get('q') ?? '',
    status: parseList(params.get('status'), TICKET_STATUSES),
    priority: parseList(params.get('priority'), TICKET_PRIORITIES),
  };
}

export function serializeFilters(f: FilterState): string {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.status.length) params.set('status', f.status.join(','));
  if (f.priority.length) params.set('priority', f.priority.join(','));
  return params.toString();
}
