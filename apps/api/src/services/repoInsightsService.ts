import type { RepoInsightsData, RepoInsightsResponse, RepoInsightsSource } from '@app/shared';
import { repoFullName } from '@app/shared';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { findProjectById } from '../repositories/projectRepository.js';
import {
  findCacheEntry,
  touchCacheEntry,
  upsertCacheEntry,
} from '../repositories/repoCacheRepository.js';
import { fetchLatestRelease, fetchRepo } from '../github/client.js';

// Dedupe concurrent cache misses for the same repo within this process.
const inFlight = new Map<string, Promise<RepoInsightsResponse>>();

function buildMeta(source: RepoInsightsSource, fetchedAt: Date) {
  return {
    source,
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: new Date(fetchedAt.getTime() + env.REPO_CACHE_TTL_MS).toISOString(),
  };
}

async function fetchFreshInsights(owner: string, name: string, etag: string | null) {
  const repoResult = await fetchRepo(owner, name, etag);

  if (repoResult.status === 304) {
    return { kind: 'not-modified' as const };
  }
  if (repoResult.status === 404) {
    throw AppError.repoNotFound(`GitHub repo "${owner}/${name}" was not found`);
  }
  if (repoResult.status !== 200 || !repoResult.body) {
    const resetNote =
      repoResult.rateLimitRemaining === 0 && repoResult.rateLimitReset
        ? ` (rate limit resets at ${new Date(repoResult.rateLimitReset * 1000).toISOString()})`
        : '';
    throw AppError.upstream(`GitHub returned ${repoResult.status}${resetNote}`);
  }

  const releaseResult = await fetchLatestRelease(owner, name).catch(() => null);
  const repo = repoResult.body;

  const data: RepoInsightsData = {
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    watchers: repo.subscribers_count,
    language: repo.language,
    license: repo.license?.name ?? null,
    defaultBranch: repo.default_branch,
    topics: repo.topics ?? [],
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    latestRelease:
      releaseResult?.status === 200 && releaseResult.body
        ? { tag: releaseResult.body.tag_name, publishedAt: releaseResult.body.published_at }
        : null,
  };

  return { kind: 'fresh' as const, data, etag: repoResult.etag };
}

async function loadInsights(owner: string, name: string): Promise<RepoInsightsResponse> {
  const key = repoFullName({ owner, name });
  const cached = await findCacheEntry(key);
  const now = new Date();

  if (cached && now.getTime() - cached.fetchedAt.getTime() < env.REPO_CACHE_TTL_MS) {
    return {
      data: cached.data as unknown as RepoInsightsData,
      meta: buildMeta('cache', cached.fetchedAt),
    };
  }

  try {
    const result = await fetchFreshInsights(owner, name, cached?.etag ?? null);

    if (result.kind === 'not-modified' && cached) {
      const updated = await touchCacheEntry(key, now);
      return {
        data: updated.data as unknown as RepoInsightsData,
        meta: buildMeta('github-revalidated', updated.fetchedAt),
      };
    }

    if (result.kind === 'fresh') {
      const row = await upsertCacheEntry(key, result.data as never, result.etag, now);
      return { data: row.data as unknown as RepoInsightsData, meta: buildMeta('github', now) };
    }

    // not-modified but nothing cached (etag mismatch race) — treat as miss.
    throw AppError.upstream('GitHub returned 304 with no cached data to revalidate');
  } catch (err) {
    if (cached) {
      return {
        data: cached.data as unknown as RepoInsightsData,
        meta: buildMeta('stale', cached.fetchedAt),
      };
    }
    if (err instanceof AppError) throw err;
    throw AppError.upstream('Failed to reach GitHub');
  }
}

export async function getRepoInsights(projectId: string): Promise<RepoInsightsResponse> {
  const project = await findProjectById(projectId);
  if (!project) throw AppError.notFound('Project not found');

  if (!project.repoOwner || !project.repoName) {
    return { data: null, meta: null };
  }

  const key = repoFullName({ owner: project.repoOwner, name: project.repoName });
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = loadInsights(project.repoOwner, project.repoName).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
