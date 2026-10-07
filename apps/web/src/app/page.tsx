'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjects } from '@/lib/hooks';
import { pluralize, useDocumentTitle } from '@/lib/format';
import { ProjectCard } from '@/components/ProjectCard';
import { Button } from '@/components/Button';
import { MetaList } from '@/components/MetaList';
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from '@/components/States';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';

export default function DashboardPage() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  useDocumentTitle('Projects');

  const totalTickets = projects?.reduce((sum, p) => sum + p.counts.total, 0) ?? 0;
  const openTickets = projects?.reduce((sum, p) => sum + p.counts.total - p.counts.DONE, 0) ?? 0;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Projects
          </h1>
          {projects ? (
            <MetaList
              className="mt-2 text-sm tabular-nums text-muted"
              items={[
                pluralize(projects.length, 'project'),
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

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          title="Couldn’t load projects"
          message="The server didn’t respond. Check your connection and try again."
          onRetry={() => refetch()}
        />
      )}

      {projects && projects.length === 0 && (
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
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
