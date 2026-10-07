import type { TicketPriority, TicketStatus } from './enums';

export interface TicketCounts {
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
  total: number;
}

export interface TicketDTO {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  repo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItemDTO extends ProjectDTO {
  counts: TicketCounts;
  recentTickets: TicketDTO[];
}

export interface ProjectDetailDTO extends ProjectDTO {
  counts: TicketCounts;
}

export interface RepoInsightsData {
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string | null;
  license: string | null;
  defaultBranch: string;
  topics: string[];
  pushedAt: string;
  updatedAt: string;
  latestRelease: { tag: string; publishedAt: string } | null;
}

export type RepoInsightsSource = 'cache' | 'github' | 'github-revalidated' | 'stale';

export interface RepoInsightsResponse {
  data: RepoInsightsData | null;
  meta: {
    source: RepoInsightsSource;
    fetchedAt: string;
    expiresAt: string;
  } | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
