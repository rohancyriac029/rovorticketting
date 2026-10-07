import { env } from '../config/env.js';

export interface GithubRepoResponse {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  language: string | null;
  license: { name: string } | null;
  default_branch: string;
  topics?: string[];
  pushed_at: string;
  updated_at: string;
}

export interface GithubReleaseResponse {
  tag_name: string;
  published_at: string;
}

export interface GithubFetchResult<T> {
  status: number;
  etag: string | null;
  rateLimitRemaining: number | null;
  rateLimitReset: number | null;
  body: T | null;
}

const BASE_URL = 'https://api.github.com';

async function githubFetch<T>(path: string, etag?: string | null): Promise<GithubFetchResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'rovorai-assignment',
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  if (etag) headers['If-None-Match'] = etag;

  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers, signal: controller.signal });
    const body = res.status === 200 || res.status === 404 ? await res.json().catch(() => null) : null;
    return {
      status: res.status,
      etag: res.headers.get('etag'),
      rateLimitRemaining: res.headers.has('x-ratelimit-remaining')
        ? Number(res.headers.get('x-ratelimit-remaining'))
        : null,
      rateLimitReset: res.headers.has('x-ratelimit-reset')
        ? Number(res.headers.get('x-ratelimit-reset'))
        : null,
      body: (res.status === 200 ? body : null) as T | null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchRepo(owner: string, name: string, etag?: string | null) {
  return githubFetch<GithubRepoResponse>(`/repos/${owner}/${name}`, etag);
}

export function fetchLatestRelease(owner: string, name: string) {
  return githubFetch<GithubReleaseResponse>(`/repos/${owner}/${name}/releases/latest`);
}
