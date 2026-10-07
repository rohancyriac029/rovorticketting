'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useProject, useTickets } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';
import { pluralize, useDocumentTitle } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from '@/components/States';
import { StatusSummary } from '@/components/StatusSummary';
import { RepoInsightsPanel } from '@/components/RepoInsightsPanel';
import {
  EMPTY_FILTERS,
  TicketFilterBar,
  hasActiveFilters,
  type FilterState,
} from '@/components/TicketFilterBar';
import { TicketList } from '@/components/TicketList';
import { CreateTicketDialog } from '@/components/CreateTicketDialog';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  // Filters live in the URL so they survive back-navigation and can be shared as a link.
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
    const qs = params.toString();
    router.replace(`/projects/${id}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  const project = useProject(id);
  const tickets = useTickets(id, {
    q: filters.q || undefined,
    status: filters.status.join(',') || undefined,
    priority: filters.priority.join(',') || undefined,
  });

  useDocumentTitle(project.data?.name);

  if (project.error instanceof ApiError && project.error.status === 404) {
    notFound();
  }

  if (project.isError) {
    return (
      <ErrorState
        title="Couldn’t load this project"
        message="The server didn’t respond. Check your connection and try again."
        onRetry={() => project.refetch()}
      />
    );
  }

  const filtered = hasActiveFilters(filters);
  const total = project.data?.counts.total ?? 0;
  const shown = tickets.data?.length ?? 0;

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Projects', href: '/' }, { label: project.data?.name ?? 'Project' }]}
      />

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        {project.data ? (
          <div className="min-w-0 max-w-2xl flex-1 basis-80">
            <h1 className="font-display text-3xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl">
              {project.data.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {project.data.description || 'No description yet.'}
            </p>
            <div className="mt-5 max-w-md">
              <StatusSummary counts={project.data.counts} />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl flex-1 basis-80" aria-hidden>
            <Skeleton className="h-10 w-64 max-w-full" />
            <Skeleton className="mt-3 h-5 w-full max-w-md" />
            <Skeleton className="mt-6 h-1.5 w-full max-w-md rounded-full" />
            <Skeleton className="mt-3 h-4 w-56" />
          </div>
        )}
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          New Ticket
        </Button>
      </div>

      {project.data?.repo && (
        <div className="mt-8">
          <RepoInsightsPanel projectId={id} />
        </div>
      )}

      <section aria-labelledby="tickets-heading" className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="tickets-heading" className="font-display text-xl font-semibold tracking-tight">
            Tickets
          </h2>
          <p aria-live="polite" className="text-sm tabular-nums text-muted">
            {tickets.data &&
              (filtered ? `${shown} of ${pluralize(total, 'ticket')}` : pluralize(shown, 'ticket'))}
          </p>
        </div>

        <TicketFilterBar value={filters} onChange={updateFilters} />

        <div className="mt-4">
          {tickets.isError ? (
            <ErrorState
              title="Couldn’t load tickets"
              message="The server didn’t respond. Check your connection and try again."
              onRetry={() => tickets.refetch()}
            />
          ) : !tickets.data ? (
            <ListSkeleton />
          ) : tickets.data.length === 0 ? (
            filtered ? (
              <EmptyState
                title="No tickets match these filters"
                description="Try a different search term, or clear the filters to see every ticket."
                action={
                  <Button variant="secondary" onClick={() => updateFilters(EMPTY_FILTERS)}>
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No tickets yet"
                description="Create the first ticket for this project."
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    New Ticket
                  </Button>
                }
              />
            )
          ) : (
            // isPlaceholderData: the previous result stays visible (dimmed) while a new search loads.
            <TicketList tickets={tickets.data} dimmed={tickets.isPlaceholderData} />
          )}
        </div>
      </section>

      <CreateTicketDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={id}
        projectName={project.data?.name}
      />
    </>
  );
}
