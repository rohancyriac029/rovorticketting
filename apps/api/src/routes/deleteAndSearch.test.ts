import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    project: { findMany: vi.fn(), deleteMany: vi.fn() },
    ticket: { findMany: vi.fn(), groupBy: vi.fn(), deleteMany: vi.fn() },
  },
}));

const { prisma } = await import('../lib/prisma.js');
const { app } = await import('../app.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DELETE endpoints', () => {
  it('deletes a project and returns 204 with no body', async () => {
    vi.mocked(prisma.project.deleteMany).mockResolvedValue({ count: 1 });
    const res = await request(app).delete('/api/projects/p1');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(prisma.project.deleteMany).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('returns 404 when the project does not exist', async () => {
    vi.mocked(prisma.project.deleteMany).mockResolvedValue({ count: 0 });
    const res = await request(app).delete('/api/projects/missing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('deletes a ticket and returns 204', async () => {
    vi.mocked(prisma.ticket.deleteMany).mockResolvedValue({ count: 1 });
    const res = await request(app).delete('/api/tickets/t1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when the ticket does not exist', async () => {
    vi.mocked(prisma.ticket.deleteMany).mockResolvedValue({ count: 0 });
    const res = await request(app).delete('/api/tickets/missing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/projects?q=', () => {
  it('searches name and description case-insensitively on the database', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);
    vi.mocked(prisma.ticket.groupBy).mockResolvedValue([] as never);

    const res = await request(app).get('/api/projects?q=%20pay%20');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'pay', mode: 'insensitive' } },
            { description: { contains: 'pay', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('rejects an over-long search term with 400', async () => {
    const res = await request(app).get(`/api/projects?q=${'x'.repeat(201)}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
