import { describe, expect, it, vi, beforeEach } from 'vitest';

const cacheStore = new Map<string, { data: unknown; etag: string | null; fetchedAt: Date }>();

vi.mock('../repositories/repoCacheRepository.js', () => ({
  findCacheEntry: vi.fn((key: string) => Promise.resolve(cacheStore.get(key) ?? null)),
  upsertCacheEntry: vi.fn((key: string, data: unknown, etag: string | null, fetchedAt: Date) => {
    const row = { repoFullName: key, data, etag, fetchedAt };
    cacheStore.set(key, row);
    return Promise.resolve(row);
  }),
  touchCacheEntry: vi.fn((key: string, fetchedAt: Date) => {
    const existing = cacheStore.get(key)!;
    existing.fetchedAt = fetchedAt;
    return Promise.resolve(existing);
  }),
}));

vi.mock('../repositories/projectRepository.js', () => ({
  findProjectById: vi.fn(() =>
    Promise.resolve({ id: 'p1', repoOwner: 'acme', repoName: 'widgets' }),
  ),
}));

const fetchRepo = vi.fn();
const fetchLatestRelease = vi.fn(() => Promise.resolve({ status: 404, body: null }));
vi.mock('../github/client.js', () => ({ fetchRepo, fetchLatestRelease }));

const { getRepoInsights } = await import('./repoInsightsService.js');

beforeEach(() => {
  cacheStore.clear();
  fetchRepo.mockReset();
  fetchLatestRelease.mockClear();
});

const githubBody = {
  full_name: 'acme/widgets',
  html_url: 'https://github.com/acme/widgets',
  description: 'desc',
  stargazers_count: 10,
  forks_count: 2,
  open_issues_count: 1,
  subscribers_count: 3,
  language: 'TypeScript',
  license: null,
  default_branch: 'main',
  topics: [],
  pushed_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('getRepoInsights caching', () => {
  it('fetches fresh data on a cold cache', async () => {
    fetchRepo.mockResolvedValue({ status: 200, etag: 'abc', body: githubBody });
    const result = await getRepoInsights('p1');
    expect(result.meta?.source).toBe('github');
    expect(fetchRepo).toHaveBeenCalledTimes(1);
  });

  it('serves from cache within the TTL window without hitting GitHub again', async () => {
    fetchRepo.mockResolvedValue({ status: 200, etag: 'abc', body: githubBody });
    await getRepoInsights('p1');
    const result = await getRepoInsights('p1');
    expect(result.meta?.source).toBe('cache');
    expect(fetchRepo).toHaveBeenCalledTimes(1);
  });

  it('falls back to stale cache when GitHub errors after the TTL expires', async () => {
    fetchRepo.mockResolvedValueOnce({ status: 200, etag: 'abc', body: githubBody });
    await getRepoInsights('p1');

    const key = 'acme/widgets';
    const entry = cacheStore.get(key)!;
    entry.fetchedAt = new Date(Date.now() - 10 * 60 * 1000); // force expiry

    fetchRepo.mockRejectedValueOnce(new Error('network down'));
    const result = await getRepoInsights('p1');
    expect(result.meta?.source).toBe('stale');
  });
});
