import type { CreateTicketInput, TicketQueryInput, UpdateTicketInput } from '@app/shared';
import { AppError } from '../lib/errors.js';
import { findProjectById } from '../repositories/projectRepository.js';
import {
  createTicket as createTicketRow,
  deleteTicketById,
  findTicketById,
  findTickets,
  updateTicket as updateTicketRow,
} from '../repositories/ticketRepository.js';
import { toTicketDTO } from './mappers.js';
import { ticketNotifier } from '../notifications/ticketNotifier.js';

export async function listTickets(projectId: string, query: TicketQueryInput) {
  const project = await findProjectById(projectId);
  if (!project) throw AppError.notFound('Project not found');

  const tickets = await findTickets(projectId, {
    q: query.q,
    status: query.status,
    priority: query.priority,
    sort: query.sort,
    order: query.order,
  });
  return tickets.map(toTicketDTO);
}

export async function getTicket(id: string) {
  const ticket = await findTicketById(id);
  if (!ticket) throw AppError.notFound('Ticket not found');
  return {
    ...toTicketDTO(ticket),
    project: ticket.project,
  };
}

export async function createTicket(projectId: string, input: CreateTicketInput) {
  const project = await findProjectById(projectId);
  if (!project) throw AppError.notFound('Project not found');

  const ticket = await createTicketRow({
    title: input.title,
    description: input.description ?? '',
    status: input.status ?? 'TODO',
    priority: input.priority ?? 'MEDIUM',
    project: { connect: { id: projectId } },
  });
  const dto = toTicketDTO(ticket);
  ticketNotifier.ticketCreated(dto, project.name);
  return dto;
}

export async function deleteTicket(id: string): Promise<void> {
  const deleted = await deleteTicketById(id);
  if (deleted === 0) throw AppError.notFound('Ticket not found');
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  const existing = await findTicketById(id);
  if (!existing) throw AppError.notFound('Ticket not found');

  const ticket = await updateTicketRow(id, input);
  return toTicketDTO(ticket);
}
