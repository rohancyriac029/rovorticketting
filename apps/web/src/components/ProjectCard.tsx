'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Github, Plus } from 'lucide-react';
import type { ProjectListItemDTO } from '@app/shared';
import { StatusDot } from './Badges';
import { StatusSummary } from './StatusSummary';
import { Button } from './Button';
import { relativeTime } from '@/lib/format';
import { CreateTicketDialog } from './CreateTicketDialog';

export function ProjectCard({ project }: { project: ProjectListItemDTO }) {
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  return (
    <article className="card flex flex-col p-5 transition-shadow duration-200 hover:shadow-pop sm:p-6">
      <header>
        <h2 className="font-display text-xl font-semibold leading-snug tracking-tight">
          <Link
            href={`/projects/${project.id}`}
            className="rounded-sm [overflow-wrap:anywhere] hover:text-accent-text"
          >
            {project.name}
          </Link>
        </h2>
        {/* Always rendered so every card's sections line up across the grid row. */}
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
          <Github className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {project.repo ? (
            <span translate="no" className="truncate">
              {project.repo}
            </span>
          ) : (
            <span className="font-normal text-faint">No repository linked</span>
          )}
        </p>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
          {project.description || 'No description yet.'}
        </p>
      </header>

      <div className="mt-4">
        <StatusSummary counts={project.counts} />
      </div>

      <section className="mt-4 flex-1 border-t border-line pt-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Recently Updated
        </h3>
        {project.recentTickets.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No tickets yet. Add the first one below.</p>
        ) : (
          <ul className="-mx-2 mt-1">
            {project.recentTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  title={ticket.title}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-sunken"
                >
                  <StatusDot status={ticket.status} />
                  <span className="min-w-0 flex-1 truncate text-ink">{ticket.title}</span>
                  <time
                    dateTime={ticket.updatedAt}
                    className="shrink-0 text-xs tabular-nums text-muted"
                  >
                    {relativeTime(ticket.updatedAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-4 flex items-center justify-between gap-2">
        <Link href={`/projects/${project.id}`} className="btn btn-ghost btn-sm -ml-3.5">
          Open Project
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTicketDialogOpen(true)}
          aria-label={`New ticket in ${project.name}`}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Ticket
        </Button>
      </footer>

      <CreateTicketDialog
        open={ticketDialogOpen}
        onClose={() => setTicketDialogOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </article>
  );
}
