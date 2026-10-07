import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS, type TicketDTO } from '@app/shared';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { createSmtpMailer, type Mailer } from './mailer.js';

export function buildTicketCreatedEmail(ticket: TicketDTO, projectName: string, appUrl?: string) {
  const lines = [
    `A new ticket was created in ${projectName}.`,
    '',
    `Title:    ${ticket.title}`,
    `Status:   ${TICKET_STATUS_LABELS[ticket.status]}`,
    `Priority: ${TICKET_PRIORITY_LABELS[ticket.priority]}`,
    '',
    ticket.description || '(no description)',
  ];
  if (appUrl) lines.push('', `Open ticket: ${appUrl.replace(/\/+$/, '')}/tickets/${ticket.id}`);

  return {
    subject: `[${projectName}] New ${TICKET_PRIORITY_LABELS[ticket.priority].toLowerCase()} priority ticket: ${ticket.title}`,
    text: lines.join('\n'),
  };
}

export function createTicketNotifier(mailer: Mailer | null, adminEmail: string | undefined) {
  if (!mailer || !adminEmail) {
    logger.info('Ticket email notifications disabled (SMTP or ADMIN_EMAIL not configured)');
  }

  return {
    /**
     * Fire-and-forget: the HTTP request never waits on SMTP, and a mail failure is
     * logged rather than failing ticket creation. No retry queue — see README.
     */
    ticketCreated(ticket: TicketDTO, projectName: string): void {
      if (!mailer || !adminEmail) return;
      const { subject, text } = buildTicketCreatedEmail(ticket, projectName, env.APP_URL);
      mailer
        .send({ to: adminEmail, subject, text })
        .then(() => logger.info({ ticketId: ticket.id }, 'Ticket notification email sent'))
        .catch((err) =>
          logger.error({ err, ticketId: ticket.id }, 'Failed to send ticket notification email'),
        );
    },
  };
}

export const ticketNotifier = createTicketNotifier(createSmtpMailer(), env.ADMIN_EMAIL);
