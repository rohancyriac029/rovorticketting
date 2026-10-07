'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useProject, useTickets } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';
import { ErrorState } from '@/components/States';
import { StatusBadge } from '@/components/Badges';
import { RepoInsightsPanel } from '@/components/RepoInsightsPanel';
import { TicketFilterBar, type FilterState } from '@/components/TicketFilterBar';
import { TicketTable } from '@/components/TicketTable';
import { CreateTicketDialog } from '@/components/CreateTicketDialog';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const filters: FilterState = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      status: searchParams.get('status')?.split(',').filter(Boolean) ?? [],
      priority: searchParams.get('priority')?.split(',').filter(Boolean) ?? [],
    }),
    [searchParams],
  );

  function updateFilters(next: FilterState) {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.status.length) params.set('status', next.status.join(','));
    if (next.priority.length) params.set('priority', next.priority.join(','));
    router.replace(`/projects/${id}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorObj,
    refetch: refetchProject,
  } = useProject(id);

  if (projectErrorObj instanceof ApiError && projectErrorObj.status === 404) {
    notFound();
  }

  const {
    data: tickets,
    isLoading: ticketsLoading,
    isError: ticketsError,
    refetch: refetchTickets,
  } = useTickets(id, {
    q: filters.q || undefined,
    status: filters.status.join(',') || undefined,
    priority: filters.priority.join(',') || undefined,
  });

  if (projectError) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message="Could not load this project." onRetry={() => refetchProject()} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {projectLoading || !project ? (
        <div className="mb-6 h-20 animate-pulse rounded-2xl bg-ochre-100 dark:bg-ink-700" />
      ) : (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{project.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
              {project.description || 'No description'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status="TODO" />
              <span className="text-xs text-[var(--text-muted)]">{project.counts.TODO}</span>
              <StatusBadge status="IN_PROGRESS" />
              <span className="text-xs text-[var(--text-muted)]">
                {project.counts.IN_PROGRESS}
              </span>
              <StatusBadge status="DONE" />
              <span className="text-xs text-[var(--text-muted)]">{project.counts.DONE}</span>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ochre-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ochre-600"
          >
            <Plus className="h-4 w-4" />
            New ticket
          </button>
        </div>
      )}

      {project?.repo && (
        <div className="mb-8">
          <RepoInsightsPanel projectId={id} />
        </div>
      )}

      <div className="mb-4">
        <TicketFilterBar value={filters} onChange={updateFilters} />
      </div>

      {ticketsError ? (
        <ErrorState message="Could not load tickets." onRetry={() => refetchTickets()} />
      ) : ticketsLoading && !tickets ? (
        <div className="h-40 animate-pulse rounded-2xl bg-ochre-100 dark:bg-ink-700" />
      ) : (
        <TicketTable
          tickets={tickets ?? []}
          hasFilters={!!(filters.q || filters.status.length || filters.priority.length)}
          onClearFilters={() => updateFilters({ q: '', status: [], priority: [] })}
        />
      )}

      <CreateTicketDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={id}
        projectName={project?.name}
      />
    </main>
  );
}
