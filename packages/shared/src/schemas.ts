import { z } from 'zod';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './enums';
import { parseRepo } from './repo';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(1000).optional().default(''),
  repo: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((val) => !val || parseRepo(val) !== null, {
      message: 'Repo must be "owner/repo" or a GitHub URL',
    }),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  status: z.enum(TICKET_STATUSES).optional().default('TODO'),
  priority: z.enum(TICKET_PRIORITIES).optional().default('MEDIUM'),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000),
    status: z.enum(TICKET_STATUSES),
    priority: z.enum(TICKET_PRIORITIES),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Request body must include at least one field',
  });
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

const commaList = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((v) => v.trim()) : undefined))
    .refine((arr) => !arr || arr.every((v) => (values as readonly string[]).includes(v)), {
      message: `Must be one of: ${values.join(', ')}`,
    }) as unknown as z.ZodType<T[number][] | undefined>;

export const ticketQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: commaList(TICKET_STATUSES),
  priority: commaList(TICKET_PRIORITIES),
  sort: z.enum(['updatedAt', 'createdAt', 'priority']).optional().default('updatedAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;
