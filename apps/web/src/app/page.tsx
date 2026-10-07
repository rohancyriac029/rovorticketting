'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useProjects } from '@/lib/hooks';
import { pluralize, useDocumentTitle } from '@/lib/format';
import { ProjectCard } from '@/components/ProjectCard';
import { Button } from '@/components/Button';
import { MetaList } from '@/components/MetaList';
import { SearchField } from '@/components/SearchField';
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from '@/components/States';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';

const GRID = 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3';

function CardGridSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 3 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// useSearchParams needs a Suspense boundary for this page to stay statically prerendered.
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <>
          <Skeleton className="mb-8 h-10 w-48" />
          <CardGridSkeleton />
        </>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  useDocumentTitle('Projects');

  // Same approach as ticket filters: read the URL once, then own the state and mirror it back.
  const [q, setQ] = useState(() => searchParams.get('q') ?? '');
  const writtenQ = useRef(q);
  useEffect(() => {
    if (q === writtenQ.current) return;
    writtenQ.current = q;
    router.replace(q ? `/?q=${encodeURIComponent(q)}` : '/', { scroll: false });
  }, [q, router]);

  const { data: projects, isError, refetch, isPlaceholderData } = useProjects(q);

  const totalTickets = projects?.reduce((sum, p) => sum + p.counts.total, 0) ?? 0;
  const openTickets = projects?.reduce((sum, p) => sum + p.counts.total - p.counts.DONE, 0) ?? 0;
  // Hidden only when there is truly nothing to search: no projects and no search term.
  const showSearch = Boolean(q) || (projects?.length ?? 0) > 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Projects
          </h1>
          {projects ? (
            <MetaList
              className="mt-2 text-sm tabular-nums text-muted"
              items={[
                `${pluralize(projects.length, 'project')}${q ? ' found' : ''}`,
                pluralize(totalTickets, 'ticket'),
                `${openTickets} open`,
              ]}
            />
          ) : (
            <Skeleton className="mt-2 h-5 w-56" />
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          New Project
        </Button>
      </div>

      {showSearch && (
        <SearchField
          value={q}
          onChange={setQ}
          label="Search projects by name or description"
          placeholder="Search projects…"
          className="mb-6 max-w-md"
        />
      )}

      {isError ? (
        <ErrorState
          title="Couldn’t load projects"
          message="The server didn’t respond. Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : !projects ? (
        <CardGridSkeleton />
      ) : projects.length === 0 ? (
        q ? (
          <EmptyState
            title={`No projects match “${q}”`}
            description="Check the spelling, or clear the search to see every project."
            action={
              <Button variant="secondary" onClick={() => setQ('')}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking tickets."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                New Project
              </Button>
            }
          />
        )
      ) : (
        // Previous results stay visible, dimmed, while a new search is loading.
        <div
          className={`${GRID} transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
          aria-busy={isPlaceholderData || undefined}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
