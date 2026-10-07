import { describe, expect, it, vi } from 'vitest';
import type { TicketDTO } from '@app/shared';
import { buildTicketCreatedEmail, createTicketNotifier } from './ticketNotifier.js';

const ticket: TicketDTO = {
  id: 't1',
  projectId: 'p1',
  title: 'Checkout fails',
  description: 'Card payments return 500',
  status: 'TODO',
  priority: 'HIGH',
  createdAt: '2026-10-07T00:00:00.000Z',
  updatedAt: '2026-10-07T00:00:00.000Z',
};

const flush = () => new Promise((r) => setImmediate(r));

describe('ticket notifications', () => {
  it('builds a subject and body with the ticket details and a link', () => {
    const email = buildTicketCreatedEmail(ticket, 'Payments API', 'https://app.example.com/');
    expect(email.subject).toBe('[Payments API] New high priority ticket: Checkout fails');
    expect(email.text).toContain('Priority: High');
    expect(email.text).toContain('https://app.example.com/tickets/t1');
  });

  it('sends to the admin address when configured', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    createTicketNotifier({ send }, 'admin@example.com').ticketCreated(ticket, 'Payments API');
    await flush();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
  });

  it('does not throw when the mail server fails', async () => {
    const send = vi.fn().mockRejectedValue(new Error('SMTP down'));
    expect(() =>
      createTicketNotifier({ send }, 'admin@example.com').ticketCreated(ticket, 'Payments API'),
    ).not.toThrow();
    await flush();
    expect(send).toHaveBeenCalledOnce();
  });

  it('is a no-op when no mailer is configured', () => {
    expect(() => createTicketNotifier(null, undefined).ticketCreated(ticket, 'X')).not.toThrow();
  });
});
