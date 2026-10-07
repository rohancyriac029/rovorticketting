import { PrismaClient, TicketPriority, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

const PROJECTS = [
  {
    name: 'Payments API',
    description: 'Core payment processing service handling charges, refunds, and payouts.',
    repoOwner: 'expressjs',
    repoName: 'express',
  },
  {
    name: 'Customer Portal',
    description: 'Self-service web portal where customers manage their accounts and billing.',
    repoOwner: 'prisma',
    repoName: 'prisma',
  },
  {
    name: 'Data Pipeline',
    description: 'Internal ETL pipeline powering analytics and reporting dashboards.',
    repoOwner: null as string | null,
    repoName: null as string | null,
  },
];

const TICKET_TEMPLATES: {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  age: number;
}[] = [
  { title: 'Fix webhook retry backoff', description: 'Retries fire too fast and overwhelm the queue.', status: 'TODO', priority: 'HIGH', age: 1 },
  { title: 'Add idempotency keys to charge endpoint', description: 'Prevent duplicate charges on client retries.', status: 'IN_PROGRESS', priority: 'HIGH', age: 2 },
  { title: 'Refund reason codes', description: 'Support structured reason codes for partial refunds.', status: 'TODO', priority: 'MEDIUM', age: 5 },
  { title: 'Payout ledger reconciliation job', description: 'Nightly job to reconcile payouts against ledger entries.', status: 'DONE', priority: 'HIGH', age: 14 },
  { title: 'Rate limit per merchant', description: 'Apply per-merchant rate limits instead of global.', status: 'TODO', priority: 'LOW', age: 8 },
  { title: 'Upgrade payment gateway SDK', description: 'Move to v4 of the gateway client library.', status: 'IN_PROGRESS', priority: 'MEDIUM', age: 3 },
  { title: 'Dashboard: dark mode toggle', description: 'Persist theme preference per user.', status: 'DONE', priority: 'LOW', age: 20 },
  { title: 'Fix billing address validation', description: 'ZIP validation rejects valid Canadian postal codes.', status: 'TODO', priority: 'MEDIUM', age: 4 },
  { title: 'Export invoices as PDF', description: 'Allow customers to download invoice history as PDF.', status: 'IN_PROGRESS', priority: 'MEDIUM', age: 6 },
  { title: 'Session timeout warning modal', description: 'Warn users 1 minute before session expiry.', status: 'DONE', priority: 'LOW', age: 18 },
  { title: 'Two-factor auth reset flow', description: 'Support account recovery when 2FA device is lost.', status: 'TODO', priority: 'HIGH', age: 2 },
  { title: 'Improve empty state for billing history', description: 'Show helpful copy when no invoices exist yet.', status: 'DONE', priority: 'LOW', age: 16 },
  { title: 'Nightly ETL job intermittently times out', description: 'Large customer segment causes job to exceed 30 min timeout.', status: 'IN_PROGRESS', priority: 'HIGH', age: 1 },
  { title: 'Add schema validation to ingest step', description: 'Reject malformed rows instead of silently dropping them.', status: 'TODO', priority: 'MEDIUM', age: 7 },
  { title: 'Backfill historical event data', description: 'Backfill 6 months of events into the new warehouse schema.', status: 'DONE', priority: 'MEDIUM', age: 21 },
  { title: 'Deduplicate events by idempotency key', description: 'Some upstream producers resend events on retry.', status: 'TODO', priority: 'HIGH', age: 3 },
  { title: 'Add data freshness alerting', description: 'Page on-call if a table hasn\'t updated in 2 hours.', status: 'IN_PROGRESS', priority: 'MEDIUM', age: 5 },
  { title: 'Document pipeline DAG dependencies', description: 'README should explain task ordering and retries.', status: 'TODO', priority: 'LOW', age: 9 },
];

async function main() {
  const existing = await prisma.project.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} project(s) already exist.`);
    return;
  }

  const createdProjects = [];
  for (const p of PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: p.name,
        description: p.description,
        repoOwner: p.repoOwner,
        repoName: p.repoName,
      },
    });
    createdProjects.push(project);
  }

  let ticketIndex = 0;
  for (const project of createdProjects) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const t = TICKET_TEMPLATES[ticketIndex % TICKET_TEMPLATES.length]!;
      ticketIndex++;
      const createdAt = daysAgo(t.age + i);
      const updatedAt = daysAgo(Math.max(t.age - i, 0));
      await prisma.ticket.create({
        data: {
          projectId: project.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          createdAt,
          updatedAt,
        },
      });
    }
  }

  console.log(`Seeded ${createdProjects.length} projects and ${ticketIndex} tickets.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
