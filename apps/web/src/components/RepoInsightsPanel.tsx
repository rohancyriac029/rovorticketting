'use client';

import { CircleDot, ExternalLink, Eye, GitFork, Github, Star } from 'lucide-react';
import type { RepoInsightsSource } from '@app/shared';
import { useRepoInsights } from '@/lib/hooks';
import { formatDateTime, formatNumber, relativeTime } from '@/lib/format';
import { Button } from './Button';
import { MetaList } from './MetaList';
import { Skeleton } from './States';

const SOURCE_LABEL: Record<RepoInsightsSource, { text: string; tone: string }> = {
  github: { text: 'Live', tone: 'tone-green' },
  'github-revalidated': { text: 'Live', tone: 'tone-green' },
  cache: { text: 'Cached', tone: 'tone-ochre' },
  stale: { text: 'Stale · GitHub unreachable', tone: 'tone-red' },
};

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="repo-insights-heading" className="card p-5 sm:p-6">
      <h2
        id="repo-insights-heading"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <Github className="h-4 w-4" aria-hidden />
        Repository Insights
      </h2>
      {children}
    </section>
  );
}

export function RepoInsightsPanel({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useRepoInsights(projectId);

  if (isLoading) {
    return (
      <PanelShell>
        <div aria-hidden>
          <Skeleton className="mt-3 h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-2 h-7 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-4 w-64 max-w-full" />
        </div>
      </PanelShell>
    );
  }

  if (isError) {
    return (
      <PanelShell>
        <p role="alert" className="mt-3 text-sm text-muted">
          Couldn’t load repository data from GitHub. The rest of the project is unaffected.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          loading={isFetching}
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </PanelShell>
    );
  }

  if (!data?.data || !data.meta) return null;

  const repo = data.data;
  const source = SOURCE_LABEL[data.meta.source];
  const details = [
    repo.language,
    repo.license,
    `Last push ${relativeTime(repo.pushedAt)}`,
    repo.latestRelease &&
      `Latest release ${repo.latestRelease.tag} (${relativeTime(repo.latestRelease.publishedAt)})`,
  ];

  return (
    <PanelShell>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noreferrer"
          translate="no"
          className="link inline-flex items-center gap-1.5 text-base"
        >
          {repo.fullName}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className={`badge ${source.tone}`}>
            <span className="dot" aria-hidden />
            {source.text}
          </span>
          <time dateTime={data.meta.fetchedAt} title={formatDateTime(data.meta.fetchedAt)}>
            Updated {relativeTime(data.meta.fetchedAt)}
          </time>
        </p>
      </div>
      {repo.description && <p className="mt-1 max-w-2xl text-sm text-muted">{repo.description}</p>}

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Metric icon={Star} label="Stars" value={repo.stars} />
        <Metric icon={GitFork} label="Forks" value={repo.forks} />
        {/* GitHub's open_issues_count includes open pull requests, so the label says so. */}
        <Metric icon={CircleDot} label="Open Issues & PRs" value={repo.openIssues} />
        <Metric icon={Eye} label="Watchers" value={repo.watchers} />
      </dl>

      <MetaList items={details} className="mt-5 border-t border-line pt-4 text-[13px] text-muted" />
    </PanelShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: number;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight text-ink">
        {formatNumber(value)}
      </dd>
    </div>
  );
}
