import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export function findProjects(q?: string) {
  const where: Prisma.ProjectWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};
  return prisma.project.findMany({ where, orderBy: { createdAt: 'asc' } });
}

export function findProjectById(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

export function createProject(data: Prisma.ProjectCreateInput) {
  return prisma.project.create({ data });
}

/** Returns how many rows were removed (0 = no such project). Tickets go with it via the FK cascade. */
export async function deleteProjectById(id: string) {
  const { count } = await prisma.project.deleteMany({ where: { id } });
  return count;
}

export function countTicketsByProjectAndStatus(projectIds: string[]) {
  return prisma.ticket.groupBy({
    by: ['projectId', 'status'],
    where: { projectId: { in: projectIds } },
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
