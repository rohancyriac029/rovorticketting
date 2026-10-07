import type { Project, Ticket, TicketStatus } from '@prisma/client';
import type { ProjectDTO, TicketCounts, TicketDTO } from '@app/shared';

export function toProjectDTO(project: Project): ProjectDTO {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    repo: project.repoOwner && project.repoName ? `${project.repoOwner}/${project.repoName}` : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toTicketDTO(ticket: Ticket): TicketDTO {
  return {
    id: ticket.id,
    projectId: ticket.projectId,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function toTicketCounts(
  grouped: { projectId: string; status: TicketStatus; _count: { _all: number } }[],
): TicketCounts {
  const counts: TicketCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, total: 0 };
  for (const row of grouped) {
    counts[row.status] = row._count._all;
    counts.total += row._count._all;
  }
  return counts;
}
