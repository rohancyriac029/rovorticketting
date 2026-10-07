import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    ticket: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

const { prisma } = await import('../lib/prisma.js');
const { app } = await import('../app.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('error responses', () => {
  it('returns 400 VALIDATION_ERROR when creating a project without a name', async () => {
    const res = await request(app).post('/api/projects').send({ description: 'no name' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 NOT_FOUND when the project does not exist', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);
    const res = await request(app).get('/api/projects/missing-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Content-Type', 'application/json')
      .send('{not valid json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
