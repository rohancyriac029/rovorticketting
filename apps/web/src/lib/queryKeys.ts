export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  tickets: (projectId: string, filters: Record<string, string | undefined>) =>
    ['tickets', projectId, filters] as const,
  ticket: (id: string) => ['ticket', id] as const,
  repoInsights: (projectId: string) => ['repoInsights', projectId] as const,
};
