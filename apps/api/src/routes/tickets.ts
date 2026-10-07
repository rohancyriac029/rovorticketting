import { Router } from 'express';
import { createTicketSchema, ticketQuerySchema, updateTicketSchema } from '@app/shared';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createTicket,
  deleteTicket,
  getTicket,
  listTickets,
  updateTicket,
} from '../services/ticketService.js';

export const projectTicketsRouter = Router();

projectTicketsRouter.get(
  '/:id/tickets',
  asyncHandler(async (req, res) => {
    const query = ticketQuerySchema.parse(req.query);
    const tickets = await listTickets(req.params.id!, query);
    res.json(tickets);
  }),
);

projectTicketsRouter.post(
  '/:id/tickets',
  asyncHandler(async (req, res) => {
    const input = createTicketSchema.parse(req.body);
    const ticket = await createTicket(req.params.id!, input);
    res.status(201).json(ticket);
  }),
);

export const ticketsRouter = Router();

ticketsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await getTicket(req.params.id!);
    res.json(ticket);
  }),
);

ticketsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteTicket(req.params.id!);
    res.status(204).end();
  }),
);

ticketsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = updateTicketSchema.parse(req.body);
    const ticket = await updateTicket(req.params.id!, input);
    res.json(ticket);
  }),
);
