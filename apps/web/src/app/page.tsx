'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjects } from '@/lib/hooks';
import { ProjectCard } from '@/components/ProjectCard';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/States';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';

export default function DashboardPage() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Projects</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Everything your team is tracking, at a glance.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ochre-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ochre-600"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Could not load projects." onRetry={() => refetch()} />}

      {!isLoading && !isError && projects && projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking tickets."
          action={
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-full bg-ochre-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ochre-600"
            >
              New project
            </button>
          }
        />
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
