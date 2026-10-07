'use client';

import { Star, GitFork, CircleDot, Clock, Tag } from 'lucide-react';
import { useRepoInsights } from '@/lib/hooks';
import { relativeTime } from '@/lib/format';
import { ErrorState } from './States';

export function RepoInsightsPanel({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } = useRepoInsights(projectId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-ochre-100 dark:bg-ink-700" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load repository insights." onRetry={() => refetch()} />;
  }

  if (!data?.data) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-sm text-[var(--text-muted)]">
        No GitHub repository connected to this project.
      </div>
    );
  }

  const { data: repo, meta } = data;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text)]">Repository Insights</h2>
        {meta && (
          <span className="text-xs text-[var(--text-muted)]">
            Updated {relativeTime(meta.fetchedAt)} ·{' '}
            {meta.source === 'cache' || meta.source === 'stale' ? 'cached' : 'live'}
          </span>
        )}
      </div>
      <a
        href={repo!.htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-sm font-medium text-ochre-600 hover:underline dark:text-ochre-300"
      >
        {repo!.fullName}
      </a>
      {repo!.description && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{repo!.description}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric icon={<Star className="h-4 w-4" />} label="Stars" value={repo!.stars} />
        <Metric icon={<GitFork className="h-4 w-4" />} label="Forks" value={repo!.forks} />
        <Metric
          icon={<CircleDot className="h-4 w-4" />}
          label="Open issues"
          value={repo!.openIssues}
        />
        <Metric
          icon={<Clock className="h-4 w-4" />}
          label="Last push"
          value={relativeTime(repo!.pushedAt)}
        />
      </div>

      {repo!.latestRelease && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Tag className="h-4 w-4" />
          Latest release {repo!.latestRelease.tag} ({relativeTime(repo!.latestRelease.publishedAt)})
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}
