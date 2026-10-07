import { CircleAlert, Inbox } from 'lucide-react';
import { Button } from './Button';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Mirrors ProjectCard's layout so content doesn't jump when data arrives. */
export function CardSkeleton() {
  return (
    <div className="card flex flex-col p-5 sm:p-6" aria-hidden>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <div className="mt-5 space-y-3 border-t border-line pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-11/12" />
      </div>
      <div className="mt-5 flex justify-between">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-line overflow-hidden" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-5 w-24 rounded-full sm:block" />
          <Skeleton className="hidden h-4 w-16 sm:block" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-text">
        <Inbox className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-danger-soft px-6 py-12 text-center"
    >
      <CircleAlert className="h-7 w-7 text-danger" aria-hidden />
      <p className="mt-3 text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
