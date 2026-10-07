import { AlertTriangle, Inbox } from 'lucide-react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-ochre-100 dark:bg-ink-700 ${className}`}
      aria-hidden
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-16 text-center">
      <Inbox className="h-10 w-10 text-ochre-400" />
      <p className="text-lg font-semibold text-[var(--text)]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900 dark:bg-rose-950/40">
      <AlertTriangle className="h-8 w-8 text-rose-500" />
      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
