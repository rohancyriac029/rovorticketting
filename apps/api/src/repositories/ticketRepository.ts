import { prisma } from '../lib/prisma.js';
import type { Prisma, TicketPriority, TicketStatus } from '@prisma/client';

export interface TicketFilters {
  q?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  sort: 'updatedAt' | 'createdAt' | 'priority';
  order: 'asc' | 'desc';
}

export function findTickets(projectId: string, filters: TicketFilters) {
  const where: Prisma.TicketWhereInput = { projectId };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.priority?.length) where.priority = { in: filters.priority };

  return prisma.ticket.findMany({
    where,
    orderBy: { [filters.sort]: filters.order },
  });
}

export function findTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true } } },
  });
}

export function createTicket(data: Prisma.TicketCreateInput) {
  return prisma.ticket.create({ data });
}

export function updateTicket(id: string, data: Prisma.TicketUpdateInput) {
  return prisma.ticket.update({ where: { id }, data });
}

/** Returns how many rows were removed (0 = no such ticket). */
export async function deleteTicketById(id: string) {
  const { count } = await prisma.ticket.deleteMany({ where: { id } });
  return count;
}

export function countTicketsForProject(projectId: string) {
  return prisma.ticket.groupBy({
    by: ['status'],
    where: { projectId },
    _count: { _all: true },
  });
}
