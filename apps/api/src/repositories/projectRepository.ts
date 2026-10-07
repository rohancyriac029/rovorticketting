import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export function findAllProjects() {
  return prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
}

export function findProjectById(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

export function createProject(data: Prisma.ProjectCreateInput) {
  return prisma.project.create({ data });
}

export function countTicketsByProjectAndStatus() {
  return prisma.ticket.groupBy({
    by: ['projectId', 'status'],
    _count: { _all: true },
  });
}

export function findRecentTicketsForProjects(projectIds: string[], take: number) {
  return Promise.all(
    projectIds.map((projectId) =>
      prisma.ticket.findMany({
        where: { projectId },
        orderBy: { updatedAt: 'desc' },
        take,
      }),
    ),
  );
}
