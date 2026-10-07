export const queryKeys = {
  /** Prefix for every project list (any search term) — invalidate this after a change. */
  projects: ['projects'] as const,
  projectList: (q: string) => ['projects', { q }] as const,
  project: (id: string) => ['project', id] as const,
  tickets: (projectId: string, filters: Record<string, string | undefined>) =>
    ['tickets', projectId, filters] as const,
  ticket: (id: string) => ['ticket', id] as const,
  repoInsights: (projectId: string) => ['repoInsights', projectId] as const,
};
