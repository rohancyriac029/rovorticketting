'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
import type { ProjectListItemDTO } from '@app/shared';
import { StatusBadge } from './Badges';
import { relativeTime } from '@/lib/format';
import { CreateTicketDialog } from './CreateTicketDialog';

export function ProjectCard({ project }: { project: ProjectListItemDTO }) {
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
            {project.description || 'No description'}
          </p>
        </div>
        <button
          onClick={() => setTicketDialogOpen(true)}
          aria-label={`Create ticket in ${project.name}`}
          title="New ticket"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ochre-500 text-white hover:bg-ochre-600"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status="TODO" />
        <span className="text-xs font-medium text-[var(--text-muted)]">{project.counts.TODO}</span>
        <StatusBadge status="IN_PROGRESS" />
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {project.counts.IN_PROGRESS}
        </span>
        <StatusBadge status="DONE" />
        <span className="text-xs font-medium text-[var(--text-muted)]">{project.counts.DONE}</span>
      </div>

      <div className="mt-4 flex-1 space-y-2">
        {project.recentTickets.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No tickets yet</p>
        ) : (
          project.recentTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block truncate rounded-lg px-2 py-1 text-sm text-[var(--text)] hover:bg-ochre-50 dark:hover:bg-ink-700"
              title={ticket.title}
            >
              <span className="text-[var(--text-muted)]">{relativeTime(ticket.updatedAt)} ·</span>{' '}
              {ticket.title}
            </Link>
          ))
        )}
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ochre-600 hover:text-ochre-700 dark:text-ochre-300"
      >
        Open project <ArrowUpRight className="h-4 w-4" />
      </Link>

      <CreateTicketDialog
        open={ticketDialogOpen}
        onClose={() => setTicketDialogOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
}
